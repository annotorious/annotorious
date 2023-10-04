import type { Annotation } from './Annotation';
import type { User } from './User';
import type { PresenceProvider } from '../presence';
import { Origin, type HoverState, type SelectionState, type Store, type ViewportState } from '../state';
import type { LifecycleEvents } from '../lifecycle';
import type { Formatter } from './Formatter';
import { parseAll, type FormatAdapter } from './FormatAdapter';

/**
 * Base annotator interface.
 * I ... internal core data model 
 * E ... external adapted representation
 */
export interface Annotator<I extends Annotation = Annotation, E extends unknown = Annotation> {

  addAnnotation(annotation: E): void;

  getAnnotationById(id: string): E | undefined;

  getAnnotations(): E[];

  getUser(): User;

  loadAnnotations(url: string): Promise<E[]>;

  removeAnnotation(arg: E | string): E;

  setAnnotations(annotations: E[]): void;

  setFormatter(formatter: Formatter): void;

  setPresenceProvider?(provider: PresenceProvider): void;

  setSelected(arg?: string | string[]): void;

  setUser(user: User): void;

  updateAnnotation(annotation: E): E;
  
  on<T extends keyof LifecycleEvents<E>>(event: T, callback: LifecycleEvents<E>[T]): void;

  off<T extends keyof LifecycleEvents<E>>(event: T, callback: LifecycleEvents<E>[T]): void;

  state: AnnotatorState<I>;

}

export interface AnnotatorState<A extends Annotation> {

  store: Store<A>;

  selection: SelectionState<A>;

  hover: HoverState<A>;

  viewport: ViewportState;

}

export const createBaseAnnotator = <I extends Annotation, E extends unknown>(
  store: Store<I>, 
  adapter?: FormatAdapter<I, E>
) => {

  const addAnnotation = (annotation: E) => {
    if (adapter) {
      const { parsed, error } = adapter.parse(annotation);
      if (parsed) {
        store.addAnnotation(parsed, Origin.REMOTE);
      } else {
        console.error(error);
      }
    } else {
      store.addAnnotation(annotation as unknown as I, Origin.REMOTE);
    }
  }

  const getAnnotationById = (id: string): E | undefined => {
    const annotation = store.getAnnotation(id);
    return (adapter && annotation) ?
      adapter.serialize(annotation) as E : annotation as unknown as E;
  }

  const getAnnotations = () =>
    (adapter ? store.all().map(adapter.serialize) : store.all()) as E[];

  const loadAnnotations = (url: string) =>
    fetch(url)
      .then((response) => response.json())
      .then((annotations) => {
        setAnnotations(annotations);
        return annotations;
      });

  const removeAnnotation = (arg: E | string): E => {
    if (typeof arg === 'string') {
      const annotation = store.getAnnotation(arg);
      store.deleteAnnotation(arg);

      return adapter ? adapter.serialize(annotation) : annotation as unknown as E;
    } else {
      const annotation = adapter ? adapter.parse(arg).parsed : (arg as unknown as I);
      store.deleteAnnotation(annotation);
      return arg;
    }
  }

  const setAnnotations = (annotations: E[]) => {
    if (adapter) {
      const { parsed, failed } = parseAll(adapter)(annotations);

      if (failed.length > 0)
        console.warn(`Discarded ${failed.length} invalid annotations`, failed);

      store.bulkAddAnnotation(parsed, true, Origin.REMOTE);
    } else {
      store.bulkAddAnnotation(annotations as unknown as I[], true, Origin.REMOTE);
    }
  }

  const updateAnnotation = (updated: E): E => {
    if (adapter) {
      const crosswalked = adapter.parse(updated).parsed;
      const previous = adapter.serialize(store.getAnnotation(crosswalked.id));
      store.updateAnnotation(crosswalked);
      return previous;
    } else {
      const previous = store.getAnnotation((updated as unknown as I).id);
      store.updateAnnotation(updated as unknown as I);
      return previous as unknown as E;
    }
  }

  return { 
    addAnnotation,
    getAnnotationById,
    getAnnotations,
    loadAnnotations,
    removeAnnotation,
    setAnnotations,
    updateAnnotation
  }

}