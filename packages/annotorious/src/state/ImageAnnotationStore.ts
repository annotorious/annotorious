import type { Annotation, Filter, Store } from '@annotorious/core';
import type { SvelteAnnotatorState, SvelteStore } from './SvelteStore';

export type ImageAnnotationStore<I extends Annotation> = Store<I> & {

  getAt(x: number, y: number, filter?: Filter<I>, buffer?: number): I | undefined;

  getIntersecting(x: number, y: number, width: number, height: number): I[];

}

export type SvelteImageAnnotationStore<I extends Annotation = Annotation> = SvelteStore<I> & ImageAnnotationStore<I>;

export type SvelteImageAnnotatorState<I extends Annotation = Annotation, E extends unknown = Annotation> = SvelteAnnotatorState<I, E> & {

  store: SvelteImageAnnotationStore<I>;

}