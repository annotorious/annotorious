export * from './Annotorious';
export * from './AnnotoriousPlugin';
export * from './ImageAnnotationPopup';
export * from './ImageAnnotator';
export * from './PopupProps';

export * from './openseadragon';

// This ensures the Annotorious stylesheet gets packaged into annotorious-react
import '@annotorious/annotorious/annotorious.css';
import '@annotorious/openseadragon/annotorious-openseadragon.css';

// Essential re-exports from @annotorious/core
export type {
  Annotation,
  AnnotationBody,
  AnnotationState,
  AnnotationTarget,
  Annotator,
  AnnotatorState,
  Appearance,
  AppearanceProvider,
  ChangeSet,
  Color,
  DrawingStyle,
  DrawingStyleExpression,
  Filter,
  FormatAdapter,
  History,
  HoverState,
  LifecycleEvents,
  ParseResult,
  PresentUser,
  Selection,
  SelectionState,
  Store,
  StoreChangeEvent,
  StoreObserver,
  User,
  W3CAnnotation,
  W3CAnnotationBody,
  W3CAnnotationTarget
} from '@annotorious/core';

export {
  createAnonymousGuest, 
  createBody,
  defaultColorProvider,
  Origin,
  UserSelectAction
} from '@annotorious/core';

// Essential re-exports from @annotorious/annotorious 
export type {
  AnnotoriousOpts,
  DrawingMode,
  DrawingTool,
  FragmentSelector,
  ImageAnnotator as AnnotoriousImageAnnotator,
  ImageAnnotation,
  ImageAnnotationTarget,
  ImageAnnotatorState,
  Polygon,
  PolygonGeometry,
  Rectangle,
  RectangleGeometry,
  Shape,
  SVGSelector,
  W3CImageAnnotation,
  W3CImageAnnotationTarget,
  W3CImageFormatAdapter, 
  W3CImageFormatAdapterOpts
} from '@annotorious/annotorious';

export {   
  chainStyles,
  computeStyle,
  createImageAnnotator,
  ShapeType,
  W3CImageFormat
} from '@annotorious/annotorious';

// Essential re-exports from @annotorious/openseadragon 
export type {
  OpenSeadragonAnnotator as AnnotoriousOpenSeadragonAnnotator
} from '@annotorious/openseadragon';

export type { Viewer } from 'openseadragon';
