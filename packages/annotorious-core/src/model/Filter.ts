import type { Annotation } from './Annotation';

export type Filter<T extends Annotation = Annotation> = (annotation: T) => boolean;