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
  W3CAnnotation
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
  ImageAnnotatorState
} from '@annotorious/annotorious';

import {   
  W3CImageFormat as _W3CImageFormat
} from '@annotorious/annotorious';

export const W3CImageFormat = _W3CImageFormat;