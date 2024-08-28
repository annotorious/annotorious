import type { Annotation, AnnotationTarget } from '@annotorious/core';
import type { Shape } from './Shape';

export interface ImageAnnotation extends Annotation {

  target: ImageAnnotationTarget;

}

export interface ImageAnnotationTarget extends AnnotationTarget {

  selector: Shape

}

export const isImageAnnotation = <T extends Annotation>(
  a: T | ImageAnnotation
): a is ImageAnnotation =>
  isImageAnnotationTarget(a.target);

 export const isImageAnnotationTarget = <T extends AnnotationTarget>(
  t: T | ImageAnnotationTarget
): t is ImageAnnotationTarget =>
  t?.annotation !== undefined &&
 (t as ImageAnnotationTarget)?.selector?.geometry?.bounds !== undefined;
