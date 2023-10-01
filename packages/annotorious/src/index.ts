export * from './annotation';
export * from './model';
export * from './state';
export * from './themes';
export * from './annotation/tools';
export * from './Annotorious';
export * from './AnnotoriousOpts';

// Re-export essentials from @annotorious/core utilities for convenience
export * from '@annotorious/core/src/model';
export * from '@annotorious/core/src/presence';
export * from '@annotorious/core/src/utils';

export type { 
  HoverState,
  Selection,
  SelectionState,
  Store,
  StoreObserver
} from '@annotorious/core/src/state';