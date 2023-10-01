import type { ImageAnnotation, Style } from '@annotorious/annotorious/src';

export interface PixiLayerConfiguration {

  /**
   * Filter functions determine whether an annotation
   * should be rendered at all, or not
   */
  filters?: PixiLayerFilter[];

  /** Determines the annotation rendering style **/
  style?: Style | PixiLayerFormatter;

}

export type PixiLayerFilter = { (annotation: ImageAnnotation): boolean }

export type PixiLayerFormatter = { (annotation: ImageAnnotation): Style }
