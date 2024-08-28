import type { Annotation, Store, SvelteAnnotatorState, SvelteStore } from '@annotorious/core';
import type { ImageAnnotation } from '../model';

export type ImageAnnotationStore<I extends Annotation> = Store<I> & {

  getAt(x: number, y: number): ImageAnnotation | undefined;

  getIntersecting(x: number, y: number, width: number, height: number): ImageAnnotation[];

}

export type SvelteImageAnnotationStore<I extends Annotation = Annotation> = SvelteStore<I> & ImageAnnotationStore<I>;

export type SvelteImageAnnotatorState<I extends Annotation = Annotation> = SvelteAnnotatorState<I> & {

  store: SvelteImageAnnotationStore<I>;

}