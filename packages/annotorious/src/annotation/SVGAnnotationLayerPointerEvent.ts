import { createEventDispatcher } from 'svelte';
import type { Annotation } from '@annotorious/core';
import type { SvelteImageAnnotationStore } from '../state';
import { isTouch } from './utils';

export interface SVGAnnotationLayerPointerEvent<T extends Annotation> {
    
  originalEvent: PointerEvent;
  
  annotation?: T;

}

// Maximum amount of ms between pointer down and up to make it a click
const MAX_CLICK_DURATION = 250;

export const addEventListeners = <T extends Annotation>(svg: SVGSVGElement, store: SvelteImageAnnotationStore<T>) => {
  const dispatch = createEventDispatcher<{ click: SVGAnnotationLayerPointerEvent<T> }>();

  let lastPointerDown: number;

  const onPointerDown = () =>
    lastPointerDown = performance.now();

  const onPointerUp = (evt: PointerEvent) => {
    const duration = performance.now() - lastPointerDown;

    if (duration < MAX_CLICK_DURATION) {
      const { x, y } = getSVGPoint(evt, svg);

      const buffer = isTouch ? 10 : 2;
      const annotation = store.getAt(x, y, undefined, buffer) as T | undefined;

      if (annotation)
        dispatch('click', { originalEvent: evt, annotation });
      else
        dispatch('click', { originalEvent: evt });
    }
  }

  return { onPointerDown, onPointerUp };
}

export const getSVGPoint = (evt: PointerEvent, svg: SVGSVGElement) => {
  const pt = svg.createSVGPoint();
  const bbox = svg.getBoundingClientRect();

  const x = evt.clientX - bbox.x;
  const y = evt.clientY - bbox.y;

  const { left, top } = svg.getBoundingClientRect();
  pt.x = x + left;
  pt.y = y + top;

  return pt.matrixTransform(svg.getScreenCTM()!.inverse());
}