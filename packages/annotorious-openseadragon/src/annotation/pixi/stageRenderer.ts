import * as PIXI from 'pixi.js';
import type OpenSeadragon from 'openseadragon';
import { ShapeType } from '@annotorious/annotorious/src';
import type { ImageAnnotation, Polygon, Rectangle } from '@annotorious/annotorious/src';
import type { DrawingStyle, Formatter } from '@annotorious/core';

const DEFAULT_FILL = 0x1a73e8;
const DEFAULT_ALPHA = 0.25;

const drawRectangle = (rectangle: Rectangle, style?: DrawingStyle) => {
  const { x, y, w, h } = rectangle.geometry;

  const fill = style?.fill ? PIXI.utils.string2hex(style.fill) : DEFAULT_FILL;
  const alpha = style.fillOpacity === undefined ? DEFAULT_ALPHA : style.fillOpacity;

  const rect = new PIXI.Graphics();
  rect.beginFill(0xffffff, alpha);
  rect.drawRect(x, y, w, h);
  rect.endFill();

  rect.tint = fill;

  return rect;
}

const drawPolygon = (polygon: Polygon, style?: DrawingStyle) => {
  const flattend = polygon.geometry.points.reduce((flat, xy) => ([...flat, ...xy]), []);   

  const fill = style?.fill ? PIXI.utils.string2hex(style.fill) : DEFAULT_FILL;
  const alpha = style.fillOpacity === undefined ? DEFAULT_ALPHA : style.fillOpacity;

  const poly = new PIXI.Graphics();
  poly.beginFill(fill, alpha);
  poly.drawPolygon(flattend);
  poly.endFill();

  return poly;
}

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
    view: canvas
  });

  // Lookup table: rendered shapes by annotation ID
  const renderedAnnotations = new Map<string, { g: PIXI.Graphics, annotation: ImageAnnotation }>(); 

  let formatter: Formatter | undefined = undefined;

  const addAnnotation = (annotation: ImageAnnotation) => {
    const { selector } = annotation.target;

    const style = formatter ? formatter(annotation) : undefined;

    let g: PIXI.Graphics;

    if (selector.type === ShapeType.RECTANGLE) {
      g = drawRectangle(selector as Rectangle, style);
    } else if (selector.type === ShapeType.POLYGON) {
      g = drawPolygon(selector as Polygon, style);
    } else {
      console.warn(`Unsupported shape type: ${selector.type}`)
    }

    if (g) {
      graphics.addChild(g);
      renderedAnnotations.set(annotation.id, { g, annotation });
    }
  }

  const removeAnnotation = (annotation: ImageAnnotation) => {
    const r = renderedAnnotations.get(annotation.id);
    if (r) {
      renderedAnnotations.delete(annotation.id);  
      r.g.destroy();
    }
  }

  const updateAnnotation = (oldValue: ImageAnnotation, newValue: ImageAnnotation) => {
    const r = renderedAnnotations.get(oldValue.id);

    if (r) {
      renderedAnnotations.delete(oldValue.id);
      r.g.destroy();

      addAnnotation(newValue)
    }
  }

  const resize = (width: number, height: number) => {
    renderer.resize(width, height);
    renderer.render(graphics);
  }

  const setFormatter = (f: Formatter | undefined) => {
    if (f) {
      renderedAnnotations.forEach(({ g, annotation }, _) => {
        const { fill } = f(annotation);
        g.tint = fill ? PIXI.utils.string2hex(fill) : DEFAULT_FILL;
      });
    } else {
      renderedAnnotations.forEach(({ g }, _) =>
        g.tint = DEFAULT_FILL);
    }
  
    formatter = f;

    renderer.render(graphics);
  }

  return {
    addAnnotation,
    redraw: redraw(viewer, graphics, renderer),
    removeAnnotation,
    resize,
    setFormatter,
    updateAnnotation
  }
  
}