import type { Annotation, AnnotoriousOpts, ImageAnnotation } from '@annotorious/annotorious';

export interface AnnotoriousOSDOpts<I extends Annotation = ImageAnnotation, E extends unknown = ImageAnnotation> extends AnnotoriousOpts<I, E> {

  // Enable SHIFT/CTRL/CMD + multi-selection
  multiSelect?: boolean;

  // Tolerance for polygon/multipolygon simplification in the WebGL display layer.
  // Set to 0 to preserve the full geometry.
  polygonSimplificationTolerance?: number;

}
