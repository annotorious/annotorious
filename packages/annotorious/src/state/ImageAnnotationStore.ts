import type { Annotation, Filter, Store, SvelteAnnotatorState, SvelteStore } from '@annotorious/core';

export type ImageAnnotationStore<I extends Annotation> = Store<I> & {

  getAt(x: number, y: number, filter?: Filter<I>): I | undefined;

  getIntersecting(x: number, y: number, width: number, height: number): I[];

}

export type SvelteImageAnnotationStore<I extends Annotation = Annotation> = SvelteStore<I> & ImageAnnotationStore<I>;

export type SvelteImageAnnotatorState<I extends Annotation = Annotation, E extends unknown = Annotation> = SvelteAnnotatorState<I, E> & {

  store: SvelteImageAnnotationStore<I>;

}