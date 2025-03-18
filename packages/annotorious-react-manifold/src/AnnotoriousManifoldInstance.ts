import { Origin } from '@annotorious/react';
import type { Annotation, AnnotationBody, Annotator } from '@annotorious/react';

export interface AnnotoriousManifoldInstance<I extends Annotation = Annotation, E extends { id: string } = Annotation> {

  annotators: Annotator<I, E>[];

  sources: string[];

  addBody(body: AnnotationBody, origin?: Origin): void;

  bulkUpdateAnnotations(annotations: I[], origin?: Origin): void; 

  clear(origin: Origin): void;

  deleteAnnotation(id: string, origin?: Origin): I | undefined;

  deleteBody(body: AnnotationBody, origin?: Origin): void;

  destroy(): void;

  findAnnotator(annotationId: string): Annotator<I, E> | undefined;

  findSource(annotationId: string): string | undefined;

  getAnnotation(id: string): I | undefined;
  
  getAnnotations(): I[];

  getAnnotator(id: string): Annotator<I, E> | undefined;
  
  setSelected(annotationId: string, editable?: boolean): void;

  updateAnnotation(arg1: string | I, arg2?: I | Origin, arg3?: Origin): void;

}

export const createManifoldInstance = <I extends Annotation = Annotation, E extends { id: string } = Annotation>(
  annotators: Map<string, Annotator<I, E>>
): AnnotoriousManifoldInstance<I, E> => {

  const find = (annotationId: string): { annotation?: I, source?: string, annotator?: Annotator<I, E> } =>
    Array.from(annotators.entries()).reduce((found, [source, annotator]) => {
      if (found)
        return found;

      const annotation = annotator.state.store.getAnnotation(annotationId);
      if (annotation) 
        return { annotation, annotator, source };
    }, undefined as { annotation: I, annotator: Annotator<I, E> } | undefined ) || 

    { annotation: undefined, annotator: undefined, source: undefined };

  /*********/
  /** API **/
  /*********/

  const addBody = (body: AnnotationBody, origin = Origin.LOCAL) => {
    const { annotator } = find(body.annotation);
    if (annotator)
      annotator.state.store.addBody(body, origin);
  }

  const clear = (origin = Origin.LOCAL) =>
    Array.from(annotators.values()).forEach(a => a.state.store.clear(origin));

  const bulkUpdateAnnotations = (annotations: I[], origin = Origin.LOCAL) => {
    const withAnnotator = annotations.map(annotation => {
      // Keep source and annotator, but replace annotation
      const { source, annotator } = find(annotation.id);
      return { source, annotator, annotation };
    }).filter(t => (t.source && t.annotator));

    const bySource = Object.groupBy(withAnnotator, t => t.source);

    Object.entries(bySource).forEach(([source, data]) => {
      const annotator = annotators.get(source);
      if (!annotator) return;

      const toUpdate: I[] = data.map(d => d.annotation).filter(Boolean);
      annotator.state.store.bulkUpdateAnnotation(toUpdate, origin);
    })
  }

  const deleteAnnotation = (id: string, origin = Origin.LOCAL) => {
    const { annotation, annotator } = find(id);

    if (annotator) {
      annotator.state.store.deleteAnnotation(id, origin);
      return annotation;
    }
  }

  const deleteBody = (body: AnnotationBody, origin = Origin.LOCAL) => {
    const { annotator } = find(body.annotation);
    if (annotator)
      annotator.state.store.deleteBody(body, origin);
  }

  const destroy = () =>
    Array.from(annotators.values()).forEach(a => a.destroy());

  const findAnnotator = (annotationId: string) => {
    const { annotator } = find(annotationId);
    return annotator;
  }

  const findSource = (annotationId: string) => {
    const { source } = find(annotationId);
    return source;
  }

  const getAnnotation = (annotationId: string) => 
    find(annotationId).annotation;

  const getAnnotations = () => 
    Array.from(annotators.values()).reduce((all, annotator) =>
      [...all, ...annotator.state.store.all()], [] as I[]);

  const getAnnotator = (id: string) => annotators.get(id);

  const updateAnnotation = (arg1: string | I, arg2?: I | Origin, arg3?: Origin) => {
    const oldId: string = typeof arg1 === 'string' ? arg1 : arg1.id;

    const { annotator } = find(oldId);
    if (annotator)
      annotator.state.store.updateAnnotation(arg1, arg2, arg3);
  }

  const setSelected = (id: string, editable?: boolean) => {
    const { annotator } = find(id);
    if (annotator)
      annotator.setSelected(id, editable);
  }

  return {
    annotators: [...annotators.values()],
    sources: [...annotators.keys()],
    addBody,
    bulkUpdateAnnotations,
    clear,
    deleteAnnotation,
    deleteBody,
    destroy,
    findAnnotator,
    findSource,
    getAnnotation,
    getAnnotations,
    getAnnotator,
    setSelected,
    updateAnnotation
  }

}