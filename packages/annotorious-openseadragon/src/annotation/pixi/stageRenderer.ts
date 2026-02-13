import * as PIXI from 'pixi.js';
import type OpenSeadragon from 'openseadragon';
import { getEditor, ShapeType } from '@annotorious/annotorious';
import type { 
  AnnotationState, 
  DrawingStyle, 
  DrawingStyleExpression, 
  Filter, 
  Selection 
} from '@annotorious/core';
import type { 
  Ellipse, 
  ImageAnnotation, 
  Line, 
  MultiPolygon, 
  MultiPolygonRing, 
  Polygon, 
  Polyline, 
  PolylinePoint, 
  Rectangle,
  Shape 
} from '@annotorious/annotorious';

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

const drawShape = <T extends Shape>(
  fn: (s: T, g: PIXI.Graphics) => void
) => (container: PIXI.Graphics, shape: T, style?: DrawingStyle, options: { strokeOnly?: boolean } = {}) => {
  const { fillStyle, strokeStyle } = getGraphicsStyle(style);

  const fillGraphics = new PIXI.Graphics();
  
  if (!options.strokeOnly) {
    fillGraphics.beginFill(0xffffff);
    fn(shape, fillGraphics); 
    fillGraphics.endFill();
    fillGraphics.tint = fillStyle.tint;
    fillGraphics.alpha = fillStyle.alpha;
  }
  
  container.addChild(fillGraphics);

  const strokeGraphics = new PIXI.Graphics();
  const lineWidth = strokeStyle.lineWidth === 1 ? 1 : strokeStyle.lineWidth / lastScale;
  strokeGraphics.lineStyle(lineWidth, 0xffffff, 1, 0.5, strokeStyle.lineWidth === 1);
  fn(shape, strokeGraphics); 
  strokeGraphics.tint = strokeStyle.tint || 0xFFFFFF;
  strokeGraphics.alpha = strokeStyle.alpha;

  container.addChild(strokeGraphics);
    
  return { fill: fillGraphics, stroke: strokeGraphics, strokeWidth: strokeStyle.lineWidth };
}

const drawRectangle = drawShape((rectangle: Rectangle, g: PIXI.Graphics) => {
  const { x, y, w, h } = rectangle.geometry;
  g.drawRect(x, y, w, h);
});

const drawEllipse = drawShape((ellipse: Ellipse, g: PIXI.Graphics) => {
  const { cx, cy, rx, ry } = ellipse.geometry;
  g.drawEllipse(cx, cy, rx, ry)
});

const drawLine = drawShape((line: Line, g: PIXI.Graphics) => {
  const [[x1, y1], [x2, y2]] = line.geometry.points;
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.closePath();
});

const drawPolygon = drawShape((polygon: Polygon, g: PIXI.Graphics) => {
  const flattened = polygon.geometry.points.reduce<number[]>((flat, xy) => ([...flat, ...xy]), []);   
  g.drawPolygon(flattened);
});

const drawPolyline = drawShape<Polyline>((polyline, g) => {
  const { points, closed } = polyline.geometry;
  
  if (points.length === 0) return;

  if (!closed)
    g.beginFill(0x000000, 0); // Transparent fill

  const drawSegment = (fromPoint: PolylinePoint, toPoint: PolylinePoint) => {
    const [fromX, fromY] = fromPoint.point;
    const [toX, toY] = toPoint.point;
  
    if (fromPoint.type === 'CURVE' || toPoint.type === 'CURVE') {
      const cp1X = fromPoint.type === 'CURVE' && fromPoint.outHandle ? fromPoint.outHandle[0] : fromX;
      const cp1Y = fromPoint.type === 'CURVE' && fromPoint.outHandle ? fromPoint.outHandle[1] : fromY;
      const cp2X = toPoint.type === 'CURVE' && toPoint.inHandle ? toPoint.inHandle[0] : toX;
      const cp2Y = toPoint.type === 'CURVE' && toPoint.inHandle ? toPoint.inHandle[1] : toY;
      
      g.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, toX, toY);
    } else {
      g.lineTo(toX, toY);
    }
  }
  
  // Start at the first point
  const firstPoint = points[0];
  g.moveTo(firstPoint.point[0], firstPoint.point[1]);
  
  // Draw segments between consecutive points
  for (let i = 1; i < points.length; i++) {
    const prevPoint = points[i - 1];
    const currentPoint = points[i];
    
    drawSegment(prevPoint, currentPoint);
  }
  
  // Handle closing the path if specified
  if (closed && points.length > 2) {
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    drawSegment(lastPoint, firstPoint);
    g.closePath();
  } else {
    g.endFill();
  }
});

const drawMultiPolygon = drawShape((multiPolygon: MultiPolygon, g: PIXI.Graphics) => {
  const flattenRing = (ring: MultiPolygonRing) => 
    ring.points.reduce<number[]>((flat, xy) => ([...flat, ...xy]), []);

  multiPolygon.geometry.polygons.forEach(element => {
    const [outer, ...holes] = element.rings;
    g.drawPolygon(flattenRing(outer));

    holes.forEach(hole => {
      g.beginHole();
      g.drawPolygon(flattenRing(hole));
      g.endHole();
    });
  });
});

const getCurrentScale = (viewer: OpenSeadragon.Viewer) => {
  const containerWidth = viewer.viewport.getContainerSize().x;
  const zoom = viewer.viewport.getZoom(true);
  return zoom * containerWidth / viewer.world.getContentFactor();
}

const redrawStage = (
  viewer: OpenSeadragon.Viewer, 
  graphics: PIXI.Graphics,
  shapes: Map<String, AnnotationShape>,
  renderer: PIXI.IRenderer<PIXI.ICanvas>
) => () => {
  const viewportBounds = viewer.viewport.viewportToImageRectangle(viewer.viewport.getBounds(true));
  const scale = getCurrentScale(viewer);

  if (scale !== lastScale || !fastRedraw) {
    fastRedraw = true;

    shapes.forEach(({ stroke, strokeWidth }) => {
      const { lineStyle } = stroke.geometry.graphicsData[0];

      if (strokeWidth > 1) {
        // Disable fast redraws if at least one shape
        // has non-native stroke
        fastRedraw = scale === lastScale;

        // Counter scale stroke
        lineStyle.width = strokeWidth / scale;
        lineStyle.native = false;

        // @ts-ignore
        stroke.geometry.invalidate();
      } else if (strokeWidth === 1 && !lineStyle.native) {
        // Set native stroke if necessary
        lineStyle.width = 1;
        lineStyle.native = true;

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

export const createStage = (viewer: OpenSeadragon.Viewer, canvas: HTMLCanvasElement) => {

  const graphics = new PIXI.Graphics();

  const renderer = PIXI.autoDetectRenderer({ 
    width: canvas.width, 
    height: canvas.height,
    backgroundAlpha: 0,
    view: canvas,
    antialias: true,
    resolution: 2
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
    // Ensure lastScale reflects this viewer's current viewport scale.
    // lastScale is module-scoped and shared across all createStage instances,
    // so it may hold a stale value from a different viewer. drawShape reads
    // lastScale to compute counter-scaled stroke widths, so we must sync it
    // here before any shapes are drawn.
    lastScale = getCurrentScale(viewer);

    // In case this annotation adds stroke > 1
    fastRedraw = false;

    // Robustness: make sure to delete any annotation with the same ID, because 
    // otherwise we'd replace the annotation in `annotationShapes` and leave 
    // zombie references on Pixi!
    const previous = annotationShapes.get(annotation.id);
    if (previous) {
      previous.fill.destroy();
      previous.stroke.destroy();
    }

    const { selector } = annotation.target;

    const s = typeof style == 'function' ? style(annotation, state) : style;

    let rendered: { fill: PIXI.Graphics, stroke: PIXI.Graphics, strokeWidth: number } | undefined;

    if (selector.type === ShapeType.RECTANGLE) {
      rendered = drawRectangle(graphics, selector as Rectangle, s);
    } else if (selector.type === ShapeType.POLYGON) {
      rendered = drawPolygon(graphics, selector as Polygon, s);
    } else if (selector.type === ShapeType.ELLIPSE) {
      rendered = drawEllipse(graphics, selector as Ellipse, s);
    } else if (selector.type === ShapeType.MULTIPOLYGON) {
      rendered = drawMultiPolygon(graphics, selector as MultiPolygon, s);
    } else if (selector.type === ShapeType.POLYLINE) {
      const polyline = selector as Polyline;
      rendered = drawPolyline(graphics, polyline, s, { strokeOnly: !polyline.geometry.closed });
    } else if (selector.type === ShapeType.LINE) {
      rendered = drawLine(graphics, selector as Line, s);
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

      if (selectedIds.has(newValue.id)) {
        const { fill, stroke } = annotationShapes.get(newValue.id)!;
        graphics.removeChild(fill);
        graphics.removeChild(stroke);
      }
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
    renderer.resize(width, height);
    renderer.render(graphics);
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

    renderer.render(graphics);
  }

  const setSelected = (selection: Selection) => {
    const nexSelectedtIds = new Set(selection.selected.map(s => s.id));

    const toSelect = selection.selected
      .filter(({ id }) => !selectedIds.has(id))

    const toDeselect = [...selectedIds]
      .filter(id => !nexSelectedtIds.has(id));

    toSelect.forEach(({ id, editable }) => {
      if (editable) {
        const rendered = annotationShapes.get(id);
        if (rendered) {
          const editor = getEditor(rendered.annotation.target.selector);

          // Remove editable annotations from the stage if an editor exists
          if (editor) {
            graphics.removeChild(rendered.fill);
            graphics.removeChild(rendered.stroke);
          }
        }
      } else {
        redrawAnnotation(id, { selected: true, hovered: id === hovered });
      }
    });

    toDeselect.forEach(id => redrawAnnotation(id, { hovered: id === hovered }));
    
    selectedIds = nexSelectedtIds;
    renderer.render(graphics);
  }

  const setHovered = (annotationId?: string) => {
    if (hovered === annotationId) return;

    if (annotationId && selectedIds.has(annotationId)) return;
    
    // Unhover current, if any
    if (hovered && !selectedIds.has(hovered))
      redrawAnnotation(hovered, { selected: selectedIds.has(hovered) });

    // Set next hover
    if (annotationId)
      redrawAnnotation(annotationId, { selected: selectedIds.has(annotationId), hovered: true });

    hovered = annotationId;

    renderer.render(graphics);
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

    renderer.render(graphics);

    redrawStage(viewer, graphics, annotationShapes, renderer)();
  }

  const setVisible = (visible: boolean) => {
    if (visible)
      canvas.classList.remove('hidden');
    else 
      canvas.classList.add('hidden');
  }
  
  const destroy = () => renderer.destroy();

  return {
    addAnnotation,
    destroy,
    getScale: () => lastScale,
    redraw: redrawStage(viewer, graphics, annotationShapes, renderer),
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