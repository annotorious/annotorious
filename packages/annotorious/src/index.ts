export * from './annotation';
export * from './model';
export * from './state';
export * from './themes';
export * from './annotation/tools';
export * from './Annotorious';
export * from './AnnotoriousOpts';
export * from './keyboardCommands';

// Essential re-exports from @annotorious/core
export type {
  Annotation,
  AnnotationBody,
  AnnotationTarget,
  Annotator,
  AnnotatorState,
  Appearance,
  AppearanceProvider,
  ChangeSet,
  Color,
  DrawingStyle,
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
  chainStyles,
  computeStyle,
  createBody,
  defaultColorProvider,
  UserSelectAction
} from '@annotorious/core'; 