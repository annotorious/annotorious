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
  Formatter,
  ParseResult,
  User,
  W3CAnnotation,
  W3CAnnotationBody,
  W3CAnnotationTarget,
  W3CSelector
} from '@annotorious/core/src/model';

import { 
  defaultColorProvider as _defaultColorProvider
} from '@annotorious/core/src/presence'; 

export const defaultColorProvider = _defaultColorProvider;

export type { 
  HoverState,
  Selection,
  SelectionState,
  Store,
  StoreChangeEvent,
  StoreObserver
} from '@annotorious/core/src/state';

import {
  PointerSelectAction as _PointerSelectAction
} from '@annotorious/core/src/state';

export const PointerSelectAction = _PointerSelectAction;

import {
  createBody as _createBody
} from '@annotorious/core/src/utils';

export const createBody = _createBody;

// Essential re-exports from @annotorious/annotorious 
export type {
  ImageAnnotator,
  ImageAnnotation,
  ImageAnnotatorState,
  Polygon,
  Rectangle,
  Shape
} from '@annotorious/annotorious';

import {   
  ShapeType as _ShapeType,
  W3CImageFormat as _W3CImageFormat
} from '@annotorious/annotorious';

export const ShapeType = _ShapeType;
export const W3CImageFormat = _W3CImageFormat;