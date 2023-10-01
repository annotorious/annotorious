import type { ImageAnnotation } from '@annotorious/annotorious/src';

export interface PixiLayerClickEvent {
  
  originalEvent: PointerEvent;
  
  annotation?: ImageAnnotation;

}