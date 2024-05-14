import type { Annotation } from './Annotation';

export type Sorter<T extends Annotation = Annotation> = (a: T, b: T) => number;

export const DEFAULT_ANNOTATION_SORTER: Sorter = (a, b) => {
  const { target: { created: createdA } } = a;
  const { target: { created: createdB } } = b;

  return (createdA?.getTime() || 0) - (createdB?.getTime() || 0);
};
