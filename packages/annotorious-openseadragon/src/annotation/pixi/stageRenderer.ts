import * as PIXI from 'pixi.js';
import type OpenSeadragon from 'openseadragon';
import { ShapeType } from '@annotorious/annotorious';
import type { AnnotationState, DrawingStyle, DrawingStyleExpression, Filter, Selection } from '@annotorious/core';
import type { Ellipse, ImageAnnotation, MultiPolygon, MultiPolygonRing, Polygon, Rectangle, Shape } from '@annotorious/annotorious';

const DEFAULT_FILL = 0xffffff;
const DEFAULT_FILL_ALPHA = 0.25;
const DEFAULT_STROKE = 0xffffff;
const DEFAULT_STROKE_ALPHA = 1;
const DEFAULT_STROKE_WIDTH = 1.5;

// Fast redraws skip counter-scaling operations
let fastRedraw = false;

// Likewise, if scale has not changed, counter-scaling is also skipped
let lastScale: number;

interface AnnotationShape {

  annotation: ImageAnnotation;

  fill: PIXI.Graphics;

  stroke: PIXI.Graphics;

  strokeWidth: number;

}

const getGraphicsStyle = (style?: DrawingStyle) => {
  const fillStyle = {
    tint: style?.fill ? new PIXI.Color(style.fill).toNumber() : DEFAULT_FILL,
    alpha: style?.fillOpacity !== undefined ?
      Math.min(style.fillOpacity, 1) :
      String(style?.fill).toLowerCase().startsWith('rgba(') ?
        (new PIXI.Color(style?.fill)).alpha :
        DEFAULT_FILL_ALPHA
  };

  const strokeStyle = {
    tint: style?.stroke ? new PIXI.Color(style.stroke).toNumber() : DEFAULT_STROKE,
    alpha: style?.strokeOpacity !== undefined ?
      Math.min(style.strokeOpacity, 1) :
      String(style?.stroke).toLowerCase().startsWith('rgba(') ?
        (new PIXI.Color(style?.stroke)).alpha :
          DEFAULT_STROKE_ALPHA,
    lineWidth: style?.strokeWidth === undefined ? DEFAULT_STROKE_WIDTH : style.strokeWidth
  }

  return { fillStyle, strokeStyle };
}

const drawSimpleShape = <T extends Shape>(
  drawFn: (s: T, g: PIXI.Graphics
) => void) => (container: PIXI.Container, shape: T, style?: DrawingStyle) => {
  const { fillStyle, strokeStyle } = getGraphicsStyle(style);

  const fillGraphics = new PIXI.Graphics();
  drawFn(shape, fillGraphics); 
  fillGraphics.fill();
  fillGraphics.tint = fillStyle.tint;
  fillGraphics.alpha = fillStyle.alpha;

  container.addChild(fillGraphics);
    
  const strokeGraphics = new PIXI.Graphics();
  const lineWidth = strokeStyle.lineWidth === 1 ? 1 : strokeStyle.lineWidth / lastScale;
  drawFn(shape, strokeGraphics); 
  strokeGraphics.stroke({ 
    width: lineWidth, 
    color: 0xffffff,
    alignment: 0.5,
    tint: strokeStyle.tint || 0xFFFFFF,
    alpha: strokeStyle.alpha,
    pixelLine: strokeStyle.lineWidth === 1
  } as PIXI.StrokeInput)

  container.addChild(strokeGraphics);
    
  return { fill: fillGraphics, stroke: strokeGraphics, strokeWidth: strokeStyle.lineWidth };
}

const drawRectangle = drawSimpleShape((rectangle: Rectangle, g: PIXI.Graphics) => {
  const { x, y, w, h } = rectangle.geometry;
  g.rect(x, y, w, h);
});

const drawEllipse = drawSimpleShape((ellipse: Ellipse, g: PIXI.Graphics) => {
  const { cx, cy, rx, ry } = ellipse.geometry;
  g.ellipse(cx, cy, rx, ry)
});

const drawPolygon = drawSimpleShape((polygon: Polygon, g: PIXI.Graphics) => {
  const flattened = polygon.geometry.points.reduce<number[]>((flat, xy) => ([...flat, ...xy]), []);   
  g.poly(flattened);
});

const drawMultiPolygon = (container: PIXI.Container, multi: MultiPolygon, style?: DrawingStyle) => {
  const flattenRing = (ring: MultiPolygonRing) => 
    ring.points.reduce<number[]>((flat, xy) => ([...flat, ...xy]), []);

  const { fillStyle, strokeStyle } = getGraphicsStyle(style);

  let fillGraphics = new PIXI.Graphics();
  let strokeGraphics = new PIXI.Graphics();

  multi.geometry.polygons.forEach(element => {
    const [outer, ...holes] = element.rings;

    fillGraphics.poly(flattenRing(outer)).fill();
    fillGraphics.tint = fillStyle.tint;
    fillGraphics.alpha = fillStyle.alpha;

    holes.forEach(hole => fillGraphics.poly(flattenRing(hole)).cut());

    container.addChild(fillGraphics);

    const lineWidth = strokeStyle.lineWidth === 1 ? 1 : strokeStyle.lineWidth / lastScale;
    strokeGraphics.stroke({ 
      width: lineWidth, 
      color: 0xffffff,
      alignment: 0.5,
      tint: strokeStyle.tint || 0xFFFFFF,
      alpha: strokeStyle.alpha,
      pixelLine: strokeStyle.lineWidth === 1
    } as PIXI.StrokeInput);

    strokeGraphics.poly(flattenRing(outer));
    holes.forEach(hole => strokeGraphics.poly(flattenRing(hole)));
  
    container.addChild(strokeGraphics);
  });

  return { fill: fillGraphics, stroke: strokeGraphics, strokeWidth: strokeStyle.lineWidth };
}

const getCurrentScale = (viewer: OpenSeadragon.Viewer) => {
  const containerWidth = viewer.viewport.getContainerSize().x;
  const zoom = viewer.viewport.getZoom(true);
  return zoom * containerWidth / viewer.world.getContentFactor();
}

const redrawStage = (
  viewer: OpenSeadragon.Viewer, 
  graphics: PIXI.Container,
  shapes: Map<String, AnnotationShape>,
  renderer?: PIXI.Renderer<PIXI.ICanvas>
) => {
  if (!renderer) return;

  const viewportBounds = viewer.viewport.viewportToImageRectangle(viewer.viewport.getBounds(true));
  const scale = getCurrentScale(viewer);

  if (scale !== lastScale || !fastRedraw) {
    fastRedraw = true;

    shapes.forEach(({ stroke, strokeWidth }) => {
      const lineStyle = stroke.strokeStyle;

      if (strokeWidth > 1) {
        // Disable fast redraws if at least one shape
        // has non-native stroke
        fastRedraw = scale === lastScale;

        // Counter scale stroke
        lineStyle.width = strokeWidth / scale;
        lineStyle.pixelLine = false;

        // @ts-ignore
        stroke.geometry.invalidate();
      } else if (strokeWidth === 1 && !lineStyle.pixelLine) {
        // Set native stroke if necessary
        lineStyle.width = 1;
        lineStyle.pixelLine = true;

        // @ts-ignore
        stroke.geometry.invalidate();
      }
    });
  }

  lastScale = scale;

  const flipped = viewer.viewport.getFlip();

  // @ts-ignore note: getRotation(true <- realtime value) only since OSD 4!
  let rotation = Math.PI * viewer.viewport.getRotation(true) / 180;

  if (rotation < 0)
    rotation += 2 * Math.PI;
  
  if (rotation > 2 * Math.PI)
    rotation -= 2 * Math.PI;

  const dx = flipped ? 
    // @ts-ignore
    viewer.viewport._containerInnerSize.x + viewportBounds.x * scale :
    - viewportBounds.x * scale;

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
  graphics.scale.set(flipped ? - scale : scale, scale);
  graphics.rotation = rotation;
  
  renderer.render(graphics);
}

export const createStage = (
  viewer: OpenSeadragon.Viewer, 
  canvas: HTMLCanvasElement
) => {
  const graphics = new PIXI.Container();

  let renderer: PIXI.Renderer;

  PIXI.autoDetectRenderer({
    width: canvas.width, 
    height: canvas.height,
    backgroundAlpha: 0,
    canvas,
    antialias: true,
    resolution: 2
  }).then(r => {
    renderer = r;

    renderer.render(graphics);
    redrawStage(viewer, graphics, annotationShapes, renderer);
  });

  // Lookup table: shapes and annotations by annotation ID
  const annotationShapes = new Map<string, AnnotationShape>(); 

  // Current selection (if any)
  let selectedIds = new Set<string>();

  // Current hover (if any)
  let hovered: string | undefined;

  // Current style (if any)
  let style: DrawingStyleExpression<ImageAnnotation> | undefined = undefined;

  lastScale = getCurrentScale(viewer);

  const addAnnotation = (annotation: ImageAnnotation, state?: AnnotationState) => {
    // In case this annotation adds stroke > 1
    fastRedraw = false; 

    const { selector } = annotation.target;

    const s = typeof style == 'function' ? style(annotation, state) : style;

    let rendered: { fill: PIXI.Graphics, stroke: PIXI.Graphics, strokeWidth: number } | undefined;

    if (selector.type === ShapeType.RECTANGLE) {
      rendered = drawRectangle(graphics, selector as Rectangle, s);
    } else if (selector.type === ShapeType.POLYGON) {
      rendered = drawPolygon(graphics, selector as Polygon, s);
    } else if (selector.type === ShapeType.ELLIPSE) {
      rendered = drawEllipse(graphics, selector as Ellipse, s);
    } else if (selector.type === ShapeType.MULTIPOLYGLON) {
      rendered = drawMultiPolygon(graphics, selector as MultiPolygon, s);
    } else {
      console.warn(`Unsupported shape type: ${selector.type}`)
    }

    if (rendered)
      annotationShapes.set(annotation.id, { annotation, ...rendered });
  }

  const removeAnnotation = (annotation: ImageAnnotation) => {
    const rendered = annotationShapes.get(annotation.id);
    if (rendered) {
      annotationShapes.delete(annotation.id); 
      rendered.fill.destroy();
      rendered.stroke.destroy(); 
    }
  }

  const updateAnnotation = (oldValue: ImageAnnotation, newValue: ImageAnnotation, state?: AnnotationState) => {
    // In case this annotation adds stroke > 1
    fastRedraw = false; 
    
    const rendered = annotationShapes.get(oldValue.id);

    if (rendered) {
      annotationShapes.delete(oldValue.id);
      rendered.fill.destroy();
      rendered.stroke.destroy();

      addAnnotation(newValue, state);
    }
  }

  const redrawAnnotation = (id: string, state?: AnnotationState) => {
    const rendered = annotationShapes.get(id);
    if (rendered) {
      annotationShapes.delete(id); 
      rendered.fill.destroy();
      rendered.stroke.destroy();

      addAnnotation(rendered.annotation, state);
    }
  }

  const resize = (width: number, height: number) => {
    renderer?.resize(width, height);
    renderer?.render(graphics);
  }

  const setFilter = (filter?: Filter<ImageAnnotation>) => {
    // In case this filter adds annotations with stroke > 1
    fastRedraw = false; 

    const { children } = graphics;

    annotationShapes.forEach(({ fill, stroke , annotation }) => {
      // Note: selected annotation always remains visible
      const visible = filter ? 
        selectedIds.has(annotation.id) || filter(annotation) : 
        true;
      
      if (visible && !(children.includes(fill))) {
        graphics.addChild(fill);
        graphics.addChild(stroke);
      } else if (!visible && children.includes(fill)) {
        graphics.removeChild(fill);
        graphics.removeChild(stroke)
      }
    });

    renderer?.render(graphics);
  }

  const setHovered = (annotationId?: string) => {
    if (hovered === annotationId) return;
    
    // Unhover current, if any
    if (hovered)
      redrawAnnotation(hovered, { selected: selectedIds.has(hovered) });

    // Set next hover
    if (annotationId)
      redrawAnnotation(annotationId, { selected: selectedIds.has(annotationId), hovered: true });

    hovered = annotationId;

    renderer?.render(graphics);
  }

  const setSelected = (selection: Selection) => {
    const nextIds = selection.selected.map(s => s.id);

    const toSelect = 
      nextIds.filter(id => !selectedIds.has(id));

    const toDeselect = [...selectedIds]
      .filter(id => !nextIds.includes(id));

    [...toSelect, ...toDeselect].forEach(id => 
      redrawAnnotation(id, { selected: nextIds.includes(id), hovered: id === hovered }));

    selectedIds = new Set(nextIds);

    renderer?.render(graphics);
  }

  const setStyle = (s?: DrawingStyleExpression<ImageAnnotation>) => {
    if (typeof s === 'function') {
      annotationShapes.forEach(({ annotation, fill, stroke, strokeWidth }, _) => {
        if (strokeWidth > 1)
          fastRedraw = false;

        const state = {
          selected: selectedIds.has(annotation.id),
          hovered: hovered === annotation.id
        };

        const { fillStyle, strokeStyle } = getGraphicsStyle(s(annotation, state));

        fill.tint = fillStyle.tint;
        fill.alpha = fillStyle.alpha;

        stroke.tint = strokeStyle.tint || 0xFFFFFF;
        stroke.alpha = strokeStyle.alpha;

        annotationShapes.set(annotation.id, { annotation, fill, stroke, strokeWidth: strokeStyle.lineWidth });
      });
    } else {
      const { fillStyle, strokeStyle } = getGraphicsStyle(s);

      if (strokeStyle.lineWidth > 1)
        fastRedraw = false;

      annotationShapes.forEach(({ annotation, fill, stroke, strokeWidth }, _) => {
        fill.tint = fillStyle.tint;
        fill.alpha = fillStyle.alpha;

        stroke.tint = strokeStyle.tint || 0xFFFFFF;
        stroke.alpha = strokeStyle.alpha;

        annotationShapes.set(annotation.id, { annotation, fill, stroke, strokeWidth: strokeStyle.lineWidth });
      });
    }
  
    style = s;
  }

  const setVisible = (visible: boolean) => {
    if (visible)
      canvas.classList.remove('hidden');
    else 
      canvas.classList.add('hidden');
  }
  
  const destroy = () => renderer?.destroy();

  return {
    addAnnotation,
    destroy,
    redraw: () => redrawStage(viewer, graphics, annotationShapes, renderer),
    removeAnnotation,
    resize,
    setFilter,
    setHovered,
    setSelected,
    setStyle,
    setVisible,
    updateAnnotation
  }
  
}