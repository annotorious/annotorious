export * from './Annotorious';
export * from './AnnotoriousPlugin';
export * from './AnnotoriousPopup';
export * from './ImageAnnotator';

export * from './openseadragon';

// This ensures the Annotorious stylesheet gets packaged into annotorious-react
import '@annotorious/annotorious/annotorious.css';
import '@annotorious/openseadragon/annotorious-openseadragon.css';

// Essential re-exports from @annotorious/core
export type {
  Annotation,
  AnnotationBody,
  AnnotationTarget,
  Annotator,
  AnnotatorState,
  DrawingStyle,
  Filter,
  FormatAdapter,
  HoverState,
  LifecycleEvents,
  ParseResult,
  Purpose,
  Selection,
  SelectionState,
  Store,
  StoreChangeEvent,
  StoreObserver,
  User,
  W3CAnnotation,
  W3CAnnotationBody,
  W3CAnnotationTarget,
  W3CSelector
} from '@annotorious/core';

import {
  createAnonymousGuest as _createAnonymousGuest, 
  Origin as _Origin,
  PointerSelectAction as _PointerSelectAction
} from '@annotorious/core';

export { _createAnonymousGuest as createAnonymousGuest };
export { _Origin as Origin };
export { _PointerSelectAction as PointerSelectAction };

// Essential re-exports from @annotorious/annotorious 
export type {
  ImageAnnotator as AnnotoriousImageAnnotator,
  ImageAnnotation
} from '@annotorious/annotorious';

// Essential re-exports from @annotorious/openseadragon 
export type {
  OpenSeadragonAnnotator as AnnotoriousOpenSeadragonAnnotator
} from '@annotorious/openseadragon';

import {   
  ShapeType as _ShapeType,
  W3CImageFormat as _W3CImageFormat
} from '@annotorious/annotorious';

export { _ShapeType as ShapeType };
export { _W3CImageFormat as W3CImageFormat };

export type { Viewer } from 'openseadragon';