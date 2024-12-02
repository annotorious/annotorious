import type { Annotation, ChangeSet, DrawingStyleExpression, FormatAdapter, UserSelectActionExpression } from '@annotorious/core';
import type { ImageAnnotation } from './model';

export interface AnnotoriousOpts<I extends Annotation = ImageAnnotation, E extends unknown = ImageAnnotation> {

  adapter?: FormatAdapter<I, E>;

  autoSave?: boolean;

  drawingEnabled?: boolean;

  // 'click': starts on single click, user cannot select unless drawingEnabled = false
  // 'drag': starts drawing on drag, single click always selects
  drawingMode?: DrawingMode;

  initialHistory?: ChangeSet<I>[];

  // Modal selection mode WILL NOT CHANGE OR DE-SELECT THE CURRENT SELECTION if another 
  // annotation or empty space is clicked. Warning: this means that the user is no longer
  // able to de-select until a programmatic de-select is triggered from the host app!
  // Use this mode only in combination with custom popups!
  modalSelect?: boolean;

  userSelectAction?: UserSelectActionExpression<E>;

  style?: DrawingStyleExpression<ImageAnnotation>;

  theme?: Theme;

}

export type DrawingMode = 'click' | 'drag';

export type Theme = 'dark' | 'light' | 'auto';

export const fillDefaults = <I extends Annotation = ImageAnnotation, E extends unknown = ImageAnnotation> (
  opts: AnnotoriousOpts<I, E>,
  defaults: AnnotoriousOpts<I, E>
): AnnotoriousOpts<I, E> => ({
  ...opts,
  drawingEnabled: opts.drawingEnabled === undefined ? defaults.drawingEnabled : opts.drawingEnabled,
  drawingMode: opts.drawingMode || defaults.drawingMode,
  userSelectAction: opts.userSelectAction || defaults.userSelectAction,
  theme: opts.theme || defaults.theme
});




