import * as PIXI from 'pixi.js';
import type OpenSeadragon from 'openseadragon';
import { ShapeType } from '@annotorious/annotorious/src';
import type { DrawingStyle, Filter } from '@annotorious/core';
import type { Ellipse, ImageAnnotation, Polygon, Rectangle, Shape } from '@annotorious/annotorious/src';

const DEFAULT_FILL = 0x1a73e8;
const DEFAULT_ALPHA = 0.25;

const drawShape = <T extends Shape>(fn: (s: T, g: PIXI.Graphics) => void) => (shape: T, style?: DrawingStyle) => {
  const fill = style?.fill ? PIXI.utils.string2hex(style.fill) : DEFAULT_FILL;
  const alpha = style?.fillOpacity === undefined ? DEFAULT_ALPHA : style.fillOpacity;
  
  const g = new PIXI.Graphics();
  g.beginFill(0xffffff, alpha);
  g.lineStyle(1, 0xffffff, 1, 0.5, true);
  fn(shape, g); 
  g.endFill();
  g.tint = fill;
  
  return g;
}

const drawEllipse = drawShape((ellipse: Ellipse, g: PIXI.Graphics) => {
  const { cx, cy, rx, ry } = ellipse.geometry;
  g.drawEllipse(cx, cy, rx, ry)
});

const drawPolygon = drawShape((polygon: Polygon, g: PIXI.Graphics) => {
  const flattend = polygon.geometry.points.reduce((flat, xy) => ([...flat, ...xy]), []);   
  g.drawPolygon(flattend);
});

const drawRectangle = drawShape((rectangle: Rectangle, g: PIXI.Graphics) => {
  const { x, y, w, h } = rectangle.geometry;
  g.drawRect(x, y, w, h);
});

const redraw = (viewer: OpenSeadragon.Viewer, graphics: PIXI.Graphics, renderer: PIXI.AbstractRenderer) => () => {
  const viewportBounds = viewer.viewport.viewportToImageRectangle(viewer.viewport.getBounds(true));

  const containerWidth = viewer.viewport.getContainerSize().x;
  const zoom = viewer.viewport.getZoom(true);
  const scale = zoom * containerWidth / viewer.world.getContentFactor();

  const rotation = Math.PI * viewer.viewport.getRotation() / 180;

  const dx = - viewportBounds.x * scale;
  const dy = - viewportBounds.y * scale;

  let offsetX: number, offsetY: number;

  if (rotation > 0 && rotation <= Math.PI / 2) {
    offsetX = viewportBounds.height * scale;
    offsetY = 0;
  } else if (rotation > Math.PI / 2 && rotation <= Math.PI) {
    offsetX = viewportBounds.width * scale;
    offsetY = viewportBounds.height * scale;
  } else if (rotation > Math.PI && rotation <= Math.PI * 1.5) {
    offsetX = 0;
    offsetY = viewportBounds.width * scale;
  } else {
    offsetX = 0;
    offsetY = 0;
  }
    
  graphics.position.x = offsetX + dx * Math.cos(rotation) - dy * Math.sin(rotation);
  graphics.position.y = offsetY + dx * Math.sin(rotation) + dy * Math.cos(rotation);
  graphics.scale.set(scale, scale);
  graphics.rotation = rotation;
  
  renderer.render(graphics);
}

export const createStage = (viewer: OpenSeadragon.Viewer, canvas: HTMLCanvasElement) => {

  const graphics = new PIXI.Graphics();

  const renderer = PIXI.autoDetectRenderer({ 
    width: canvas.width, 
    height: canvas.height,
    backgroundAlpha: 0,
    view: canvas,
    antialias: true
  });

  // Lookup table: shapes and annotations by annotation ID
  const annotationShapes = new Map<string, { g: PIXI.Graphics, annotation: ImageAnnotation }>(); 

  let style: DrawingStyle | ((a: ImageAnnotation) => DrawingStyle) | undefined = undefined;

  const addAnnotation = (annotation: ImageAnnotation) => {
    const { selector } = annotation.target;

    const s = typeof style == 'function' ? style(annotation) : style;

    let g: PIXI.Graphics;

    if (selector.type === ShapeType.RECTANGLE) {
      g = drawRectangle(selector as Rectangle, s);
    } else if (selector.type === ShapeType.POLYGON) {
      g = drawPolygon(selector as Polygon, s);
    } else if (selector.type === ShapeType.ELLIPSE) {
      g = drawEllipse(selector as Ellipse, s);
    } else {
      console.warn(`Unsupported shape type: ${selector.type}`)
    }

    if (g) {
      graphics.addChild(g);
      annotationShapes.set(annotation.id, { g, annotation });
    }
  }

  const removeAnnotation = (annotation: ImageAnnotation) => {
    const r = annotationShapes.get(annotation.id);
    if (r) {
      annotationShapes.delete(annotation.id);  
      r.g.destroy();
    }
  }

  const updateAnnotation = (oldValue: ImageAnnotation, newValue: ImageAnnotation) => {
    const r = annotationShapes.get(oldValue.id);

    if (r) {
      annotationShapes.delete(oldValue.id);
      r.g.destroy();

      addAnnotation(newValue)
    }
  }

  const resize = (width: number, height: number) => {
    renderer.resize(width, height);
    renderer.render(graphics);
  }

  const setFilter = (filter: Filter) => {
    const { children } = graphics;

    annotationShapes.forEach(({ g, annotation }) => {
      const visible = filter ? filter(annotation) : true;
      
      if (visible && !(children.includes(g))) {
        graphics.addChild(g);
      } else if (!visible && children.includes(g)) {
        graphics.removeChild(g);
      }
    });

    renderer.render(graphics);
  }

  const setStyle = (s: DrawingStyle | ((a: ImageAnnotation) => DrawingStyle) | undefined) => {
    if (typeof s === 'function') {
      annotationShapes.forEach(({ g, annotation }, _) => {
        const style = s(annotation);
        if (style) {
          g.tint = style.fill ? PIXI.utils.string2hex(style.fill) : DEFAULT_FILL;
        } else {
          g.tint = DEFAULT_FILL;
        }
      });
    } else {
      const fill = s?.fill ? PIXI.utils.string2hex(s.fill) : DEFAULT_FILL;
      annotationShapes.forEach(({ g }, _) => g.tint = fill);
    }
  
    style = s;

    renderer.render(graphics);
  }

  const destroy = () => renderer.destroy();

  return {
    addAnnotation,
    destroy,
    redraw: redraw(viewer, graphics, renderer),
    removeAnnotation,
    resize,
    setFilter,
    setStyle,
    updateAnnotation
  }
  
}