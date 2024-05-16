import type { Annotation, DrawingStyle, DrawingStyleExpression, FormatAdapter, PointerSelectAction } from '@annotorious/core';
import type { ImageAnnotation } from './model';

export interface AnnotoriousOpts<I extends Annotation = ImageAnnotation, E extends unknown = ImageAnnotation> {

  adapter?: FormatAdapter<I, E>;

  autoSave?: boolean;

  drawingEnabled?: boolean;

  // 'click': starts on single click, user cannot select unless drawingEnabled = false
  // 'drag': starts drawing on drag, single click always selects
  drawingMode?: DrawingMode;

  pointerSelectAction?: PointerSelectAction | ((a: I) => PointerSelectAction);

  style?: DrawingStyleExpression<ImageAnnotation>;

  theme?: Theme;

}

export type DrawingMode = 'click' | 'drag';

export type Theme = 'dark' | 'light' | 'auto';

export const fillDefaults = <I extends ImageAnnotation = ImageAnnotation, E extends unknown = ImageAnnotation> (
  opts: AnnotoriousOpts<I, E>,
  defaults: AnnotoriousOpts<I, E>
): AnnotoriousOpts<I, E> => {

  return {
    ...opts,
    drawingEnabled: opts.drawingEnabled === undefined ? defaults.drawingEnabled : opts.drawingEnabled,
    drawingMode: opts.drawingMode || defaults.drawingMode,
    pointerSelectAction: opts.pointerSelectAction || defaults.pointerSelectAction,
    theme: opts.theme || defaults.theme
  };

};




