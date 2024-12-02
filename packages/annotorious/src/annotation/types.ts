import type { Annotation, DrawingStyleExpression, Filter, StoreChangeEvent, User } from '@annotorious/core';
import type { ImageAnnotation, ImageAnnotatorState, DrawingMode } from '@annotorious/annotorious';
import type { SvelteImageAnnotatorState } from 'src/state';
import type { Polygon, PolygonGeometry, Shape, ShapeName, ShapeType } from 'src/model';
import type { Transform } from './Transform';
import type { Rectangle } from './shapes';

export type SVGLayerProps<I extends Annotation, E extends unknown> = {
  drawingEnabled: boolean;
  image: HTMLImageElement | HTMLCanvasElement;
  preferredDrawingMode: DrawingMode;
  imageAnnotatorState: SvelteImageAnnotatorState<I, E>;
  style: DrawingStyleExpression<ImageAnnotation> | undefined;
  toolName?: ShapeName;
  user: User;
  visible?: boolean;
} 

export type PolygonEditorProps = {
  shape: Polygon,
  computedStyle?: string | undefined,
  transform: Transform,
  viewportScale: number 
}

export type RectangleProps = {
    shape: Rectangle;
    computedStyle: string | undefined;
    transform: Transform;
    viewportScale?: number;
}