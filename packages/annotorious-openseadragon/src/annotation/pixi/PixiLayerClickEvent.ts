import type { Annotation } from '@annotorious/annotorious/src';

export interface PixiLayerClickEvent<I extends Annotation> {
  
  originalEvent: PointerEvent;
  
  annotation?: I;

}