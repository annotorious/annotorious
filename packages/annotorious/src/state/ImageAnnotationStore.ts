import type { Store, SvelteAnnotatorState, SvelteStore } from '@annotorious/core';
import type { ImageAnnotation } from '../model';

export type ImageAnnotationStore = Store<ImageAnnotation> & {

  getAt(x: number, y: number): ImageAnnotation | undefined;

  getIntersecting(x: number, y: number, width: number, height: number): ImageAnnotation[];

}

export type SvelteImageAnnotationStore = SvelteStore<ImageAnnotation> & ImageAnnotationStore;

export type SvelteImageAnnotatorState = SvelteAnnotatorState<ImageAnnotation> & {

  store: SvelteImageAnnotationStore;

}