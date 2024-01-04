import type { Annotation } from './Annotation';
import type { User } from './User';
import type { PresenceProvider } from '../presence/PresenceProvider';
import { Origin, type HoverState, type SelectionState, type Store, type UndoStack, type ViewportState } from '../state';
import type { LifecycleEvents } from '../lifecycle/LifecycleEvents';
import { parseAll, type FormatAdapter } from './FormatAdapter';
import type { DrawingStyle } from './DrawingStyle';
import type { Filter } from './Filter';

/**
 * Base annotator interface.
 * I ... internal core data model 
 * E ... external adapted representation
 */
export interface Annotator<I extends Annotation = Annotation, E extends unknown = Annotation> {

  addAnnotation(annotation: E): void;

  cancelSelected(): void;

  canRedo(): boolean;

  canUndo(): boolean;

  clearAnnotations(): void;

  destroy(): void;

  getAnnotationById(id: string): E | undefined;

  getAnnotations(): E[];

  getSelected(): E[];

  getUser(): User;

  loadAnnotations(url: string): Promise<E[]>;

  redo(): void;

  removeAnnotation(arg: E | string): E;

  setAnnotations(annotations: E[]): void;

  setFilter(filter: Filter): void;

  setPresenceProvider?(provider: PresenceProvider): void;

  setSelected(arg?: string | string[]): void;

  setStyle(arg: DrawingStyle | ((annotation: I) => DrawingStyle) | undefined): void;

  setUser(user: User): void;

  undo(): void;

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
  state: AnnotatorState<I>, 
  undoStack: UndoStack<I>,
  adapter?: FormatAdapter<I, E>
) => {

  const { store, selection } = state;

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

  const cancelSelected = () => selection.clear();

  const clearAnnotations = () => store.clear();

  const getAnnotationById = (id: string): E | undefined => {
    const annotation = store.getAnnotation(id);
    return (adapter && annotation) ?
      adapter.serialize(annotation) as E : annotation as unknown as E;
  }

  const getAnnotations = () =>
    (adapter ? store.all().map(adapter.serialize) : store.all()) as E[];

  const getSelected = () => {
    const selectedIds = selection.selected?.map(s => s.id) || [];

    const selected = selectedIds.map(id => store.getAnnotation(id)!).filter(Boolean);

    return adapter 
      ? selected.map(adapter.serialize) 
      : selected as unknown as E[];
  }

  const loadAnnotations = (url: string) =>
    fetch(url)
      .then((response) => response.json())
      .then((annotations) => {
        setAnnotations(annotations);
        return annotations;
      });

  const removeAnnotation = (arg: E | string): E | undefined => {
    if (typeof arg === 'string') {
      const annotation = store.getAnnotation(arg);
      store.deleteAnnotation(arg);

      if (annotation)
        return adapter ? adapter.serialize(annotation) : annotation as unknown as E;
    } else {
      const annotation = adapter ? adapter.parse(arg).parsed : (arg as unknown as I);

      if (annotation) {
        store.deleteAnnotation(annotation);
        return arg;
      }
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

  const setSelected = (arg?: string | string[]) => {
    if (arg) {
      selection.setSelected(arg);
    } else {
      selection.clear();
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

  // Note that we don't spread the undoStack - it has a .destroy()
  // method that would likely get overwritten by other Annotator implementations
  // if people are not careful.
  return { 
    addAnnotation,
    cancelSelected,
    canRedo: undoStack.canRedo,
    canUndo: undoStack.canUndo,
    clearAnnotations,
    getAnnotationById,
    getAnnotations,
    getSelected,
    loadAnnotations,
    redo: undoStack.redo,
    removeAnnotation,
    setAnnotations,
    setSelected,
    undo: undoStack.undo,
    updateAnnotation
  }

}