import type { Annotation } from './Annotation';

export type Sorter<T extends Annotation = Annotation> = (a: T, b: T) => number;
