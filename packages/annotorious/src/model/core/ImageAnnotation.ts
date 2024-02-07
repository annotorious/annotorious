import type { Annotation, AnnotationTarget } from '@annotorious/core';
import type { Shape } from './Shape';

export interface ImageAnnotation extends Annotation {

  // ImageAnnotation handles only a single target
  targets: ImageAnnotationTarget[];

}

export interface ImageAnnotationTarget extends AnnotationTarget {

  selector: Shape

}
