import { createEventDispatcher } from 'svelte';
import type { SvelteImageAnnotationStore } from '../state';
import type { ImageAnnotation } from '../model';
import { isTouch } from './utils';
import type { SvelteStore } from '@annotorious/core';

export interface SVGAnnotationLayerPointerEvent {
    
  originalEvent: PointerEvent;
  
  annotation?: ImageAnnotation;

}

// Maximum amount of ms between pointer down and up to make it a click
const MAX_CLICK_DURATION = 200;

export const addEventListeners = (svg: SVGSVGElement, store: SvelteImageAnnotationStore) => {

  const dispatch = createEventDispatcher<{ click: SVGAnnotationLayerPointerEvent}>();

  let lastPointerDown: number;

  const onPointerDown = () =>
    lastPointerDown = new Date().getTime();

  const onPointerUp = (evt: PointerEvent) => {
    const duration = new Date().getTime() - lastPointerDown;

    if (duration < MAX_CLICK_DURATION) {
      const { x, y } = getSVGPoint(evt, svg);
      const annotation = store.getAt(x, y);
    
      if (annotation)
        dispatch('click', { originalEvent: evt, annotation });
      else
        dispatch('click', { originalEvent: evt });
    }
  }

  return { onPointerDown, onPointerUp };
}

const getSVGPoint = (evt: PointerEvent, svg: SVGSVGElement) => {
  const pt = svg.createSVGPoint();

  if (isTouch) {
    const bbox = svg.getBoundingClientRect();

    const x = evt.clientX - bbox.x;
    const y = evt.clientY - bbox.y;

    const { left, top } = svg.getBoundingClientRect();
    pt.x = x + left;
    pt.y = y + top;

    return pt.matrixTransform(svg.getScreenCTM().inverse());
  } else {
    pt.x = evt.offsetX;
    pt.y = evt.offsetY;

    return pt.matrixTransform(svg.getCTM().inverse());
  }
}