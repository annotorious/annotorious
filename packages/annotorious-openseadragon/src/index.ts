export * from './Annotorious';

// Essential re-exports from @annotorious/core
export type {
  Annotation,
  AnnotationBody,
  AnnotationTarget,
  Annotator,
  AnnotatorState,
  Color,
  DrawingStyle,
  FormatAdapter,
  HoverState,
  Selection,
  SelectionState,
  Store,
  StoreChangeEvent,
  StoreObserver,
  ParseResult,
  User,
  W3CAnnotation,
  W3CAnnotationBody,
  W3CAnnotationTarget,
  W3CSelector
} from '@annotorious/core';

import { 
  createBody as _createBody,
  defaultColorProvider as _defaultColorProvider,
  PointerSelectAction as _PointerSelectAction
} from '@annotorious/core'; 

export const defaultColorProvider = _defaultColorProvider;
export const PointerSelectAction = _PointerSelectAction;
export const createBody = _createBody;

// Essential re-exports from @annotorious/annotorious 
export type {
  ImageAnnotator,
  ImageAnnotation,
  ImageAnnotatorState,
  Polygon,
  PolygonGeometry,
  Rectangle,
  RectangleGeometry,
  Shape
} from '@annotorious/annotorious';

import {   
  ShapeType as _ShapeType,
  W3CImageFormat as _W3CImageFormat
} from '@annotorious/annotorious';

export const ShapeType = _ShapeType;
export const W3CImageFormat = _W3CImageFormat;