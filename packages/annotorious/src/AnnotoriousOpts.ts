import { PointerSelectAction } from '@annotorious/core';
import type { Annotation, FormatAdapter } from '@annotorious/core';
import type { ImageAnnotation } from './model';

export interface AnnotoriousOpts<I extends Annotation = ImageAnnotation, E extends unknown = ImageAnnotation> {

  adapter?: FormatAdapter<I, E>;

  autoSave?: boolean;

  pointerSelectAction?: PointerSelectAction | ((a: I) => PointerSelectAction);

  readOnly?: boolean;

  style?: Style | ((a: E) => Style);

}

export interface Style {

  fill?: string 

  fillOpacity?: number 

  stroke?: string

  strokeOpacity?: number
  
}

export const fillDefaults = <I extends ImageAnnotation = ImageAnnotation, E extends unknown = ImageAnnotation> (
  opts: AnnotoriousOpts<I, E>
): AnnotoriousOpts<I, E> => {

  return {
    ...opts,
    pointerSelectAction: opts.pointerSelectAction || PointerSelectAction.EDIT
  };

};




