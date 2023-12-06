import type { Annotation } from '../model';
import type { Store } from './Store';
import { Origin } from './StoreObserver';
import type { ChangeSet, StoreChangeEvent, Update } from './StoreObserver';

export interface UndoStack {

  destroy(): void;

  undo(): void;

  redo(): void;

}

const debounce = <T extends Annotation>(handler: Function, wait: number) => {
  let timeoutId = null;

  return (event: StoreChangeEvent<T>) => {
    window.clearTimeout(timeoutId);

    timeoutId = window.setTimeout(() => {
      handler(event);
    }, wait);
  };
}

export const createUndoStack = <T extends Annotation>(store: Store<T>): UndoStack => {

  const changeStack: ChangeSet<T>[] = [];

  let pointer = -1;

  let muteEvents = false;

  const onChange = (event: StoreChangeEvent<T>) => {
    const { changes } = event;

    if (!muteEvents) {
      changeStack.splice(pointer + 1);
      changeStack.push(changes);

      pointer = changeStack.length - 1;
    }
      
    muteEvents = false;
  }

  store.observe(onChange, { origin: Origin.LOCAL });

  const undoCreated = (created: T[]) => 
    created?.length > 0 && store.bulkDeleteAnnotation(created);

  const redoCreated = (created: T[]) =>
    created?.length > 0 && store.bulkAddAnnotation(created, false);

  const undoUpdated = (updated: Update<T>[]) =>
    updated?.length > 0 && updated.forEach(({ oldValue }) => store.updateAnnotation(oldValue));
  
  const redoUpdated = (updated: Update<T>[]) =>
    updated?.length > 0 && updated.forEach(({ newValue }) => store.updateAnnotation(newValue));

  const undoDeleted = (deleted: T[]) => 
    deleted?.length > 0 && store.bulkAddAnnotation(deleted, false);

  const redoDeleted = (deleted: T[]) =>
    deleted?.length > 0 && store.bulkDeleteAnnotation(deleted);

  const undo = () => {
    if (pointer > -1) {
      muteEvents = true;

      const { created, updated, deleted} = changeStack[pointer];

      undoCreated(created);
      undoUpdated(updated);
      undoDeleted(deleted);

      pointer -= 1;
    }
  }

  const redo = () => {
    if (changeStack.length - 1 > pointer) {
      muteEvents = true;

      const { created, updated, deleted } = changeStack[pointer + 1];

      redoCreated(created);
      redoUpdated(updated);
      redoDeleted(deleted);

      pointer += 1;
    }
  }

  const destroy = () => store.unobserve(onChange);

  return {
    destroy,
    redo,
    undo
  }

}