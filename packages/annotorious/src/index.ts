export * from './annotation';
export * from './model';
export * from './state';
export * from './themes';
export * from './annotation/tools';
export * from './Annotorious';
export * from './AnnotoriousOpts';
export * from './keyboardCommands';

// Re-export essentials from @annotorious/core utilities for convenience
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