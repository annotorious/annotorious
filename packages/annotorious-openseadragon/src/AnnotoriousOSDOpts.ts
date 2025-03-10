import type { Annotation, AnnotoriousOpts, ImageAnnotation } from '@annotorious/annotorious';

export interface AnnotoriousOSDOpts<I extends Annotation = ImageAnnotation, E extends unknown = ImageAnnotation> extends AnnotoriousOpts<I, E> {

  // Enable SHIFT/CTRL/CMD + multi-selection
  multiSelect?: boolean;

}
