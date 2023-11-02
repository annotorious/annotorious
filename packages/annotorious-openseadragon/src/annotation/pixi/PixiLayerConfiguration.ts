import type { DrawingStyle, ImageAnnotation } from '@annotorious/annotorious/src';

export interface PixiLayerConfiguration {

  /**
   * Filter functions determine whether an annotation
   * should be rendered at all, or not
   */
  filters?: PixiLayerFilter[];

  /** Determines the annotation rendering style **/
  style?: DrawingStyle | ((a: ImageAnnotation) => DrawingStyle);

}

export type PixiLayerFilter = { (annotation: ImageAnnotation): boolean }
