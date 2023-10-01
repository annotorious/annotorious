import type { Annotation } from '../model';

export interface LifecycleEvents<T extends unknown = Annotation> {

  createAnnotation: (annotation: T) => void;

  deleteAnnotation: (annotation: T) => void;

  mouseEnterAnnotation: (annotation: T) => void;

  mouseLeaveAnnotation: (annotation: T) => void;

  selectionChanged: (annotation: T[]) => void;

  updateAnnotation: (annotation: T, previous: T) => void;

  viewportIntersect: (visible: T[]) => void;

}