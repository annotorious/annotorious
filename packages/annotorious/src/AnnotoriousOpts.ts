import { PointerSelectAction } from '@annotorious/core';
import type { Annotation, DrawingStyle, FormatAdapter } from '@annotorious/core';
import type { ImageAnnotation } from './model';

export interface AnnotoriousOpts<I extends Annotation = ImageAnnotation, E extends unknown = ImageAnnotation> {

  adapter?: FormatAdapter<I, E>;

  autoSave?: boolean;

  drawingEnabled?: boolean;

  drawOnSingleClick?: boolean;

  pointerSelectAction?: PointerSelectAction | ((a: I) => PointerSelectAction);

  style?: DrawingStyle | ((annotation: I) => DrawingStyle);

}

export const fillDefaults = <I extends ImageAnnotation = ImageAnnotation, E extends unknown = ImageAnnotation> (
  opts: AnnotoriousOpts<I, E>
): AnnotoriousOpts<I, E> => {

  return {
    ...opts,
    drawingEnabled: opts.drawingEnabled === undefined,
    pointerSelectAction: opts.pointerSelectAction || PointerSelectAction.EDIT
  };

};




