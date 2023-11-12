import { PointerSelectAction } from '@annotorious/core';
import type { Annotation, DrawingStyle, FormatAdapter } from '@annotorious/core';
import type { ImageAnnotation } from './model';

export interface AnnotoriousOpts<I extends Annotation = ImageAnnotation, E extends unknown = ImageAnnotation> {

  adapter?: FormatAdapter<I, E>;

  autoSave?: boolean;

  drawingEnabled?: boolean;

  // 'click': starts on single click, user cannot select unless drawingEnabled = false
  // 'drag': starts drawing on drag, single click always selects
  drawingMode?: DrawingMode;

  pointerSelectAction?: PointerSelectAction | ((a: I) => PointerSelectAction);

  style?: DrawingStyle | ((annotation: I) => DrawingStyle);

}

export type DrawingMode = 'click' | 'drag';

export const fillDefaults = <I extends ImageAnnotation = ImageAnnotation, E extends unknown = ImageAnnotation> (
  opts: AnnotoriousOpts<I, E>
): AnnotoriousOpts<I, E> => {

  return {
    ...opts,
    drawingEnabled: opts.drawingEnabled === undefined ? true : opts.drawingEnabled,
    drawingMode: opts.drawingMode || 'drag',
    pointerSelectAction: opts.pointerSelectAction || PointerSelectAction.EDIT
  };

};




