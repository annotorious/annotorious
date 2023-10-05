export * from './Annotorious';
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
  Appearance,
  AppearanceProvider,
  PresenceEvents,
  PresenceProvider,
  PresenceState,
  PresentUser
} from '@annotorious/core/src/presence';

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
  ImageAnnotator as AnnotoriousImageAnnotator,
  ImageAnnotation
} from '@annotorious/annotorious';

// Essential re-exports from @annotorious/openseadragon 
export type {
  OpenSeadragonAnnotator as AnnotoriousOpenSeadragonAnnotator
} from '@annotorious/openseadragon';
