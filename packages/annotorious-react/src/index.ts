export * from './Annotorious';
export * from './AnnotoriousPlugin';
export * from './ImageAnnotationPopup';
export * from './ImageAnnotator';
export * from './PopupProps';

// This ensures the Annotorious stylesheet gets packaged into annotorious-react
import '@annotorious/annotorious/annotorious.css';

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
  MultiPolygon,
  MultiPolygonElement,
  MultiPolygonGeometry,
  MultiPolygonRing,
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
  boundsFromPoints,
  chainStyles,
  computeStyle,
  createImageAnnotator,
  parseFragmentSelector,
  parseSVGSelector,
  parseW3CImageAnnotation,
  serializeFragmentSelector,
  serializeSVGSelector,
  serializeW3CImageAnnotation,
  ShapeType,
  W3CImageFormat
} from '@annotorious/annotorious';
