export * from './Annotorious';
export * from './AnnotoriousOSDOpts';

// Essential re-exports from @annotorious/core
export type {
  Annotation,
  AnnotationBody,
  AnnotationState,
  AnnotationTarget,
  Annotator,
  AnnotatorState,
  ChangeSet,
  Color,
  DrawingStyle,
  DrawingStyleExpression,
  FormatAdapter,
  History,
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
  W3CAnnotationTarget
} from '@annotorious/core';

export { 
  createBody,
  defaultColorProvider,
  UserSelectAction
} from '@annotorious/core'; 

// Essential re-exports from @annotorious/annotorious 
export type {
  AnnotoriousOpts,
  DrawingMode,
  DrawingTool,
  FragmentSelector,
  ImageAnnotation,
  ImageAnnotator,
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
