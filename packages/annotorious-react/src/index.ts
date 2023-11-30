export * from './Annotorious';
export * from './AnnotoriousPlugin';
export * from './AnnotoriousPopup';
export * from './ImageAnnotator';

export * from './openseadragon';

// This ensures the Annotorious stylesheet gets packaged into annotorious-react
import '@annotorious/annotorious/annotorious.css';
import '@annotorious/openseadragon/annotorious-openseadragon.css';

export type {
  LifecycleEvents
} from '@annotorious/core/src/lifecycle';

// Essential re-exports from @annotorious/core
export * from '@annotorious/core/src/model';
export * from '@annotorious/core/src/presence';
export * from '@annotorious/core/src/utils';

export type { 
  HoverState,
  Selection,
  SelectionState,
  Store,
  StoreChangeEvent,
  StoreObserver
} from '@annotorious/core/src/state';

import {
  Origin as _Origin,
  PointerSelectAction as _PointerSelectAction
} from '@annotorious/core/src/state';

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