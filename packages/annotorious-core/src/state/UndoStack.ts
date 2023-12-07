import type { Annotation } from '../model';
import type { Store } from './Store';
import { Origin } from './StoreObserver';
import { mergeChanges, type ChangeSet, type StoreChangeEvent, type Update } from './StoreObserver';

// Duration with fast successive changes get merged 
// with the last event in the stack, rather than getting stacked
// as a new undo/redo step.
const DEBOUNCE = 250;

export interface UndoStack {

  destroy(): void;

  undo(): void;

  redo(): void;

}

export const createUndoStack = <T extends Annotation>(store: Store<T>): UndoStack => {

  const changeStack: ChangeSet<T>[] = [];

  let pointer = -1;

  let muteEvents = false;

  let lastEvent = 0;

  const onChange = (event: StoreChangeEvent<T>) => {
    if (!muteEvents) {
      const { changes } = event;

      const now = performance.now();

      if (now - lastEvent > DEBOUNCE) {
        // Put this change on the stack...
        changeStack.splice(pointer + 1);
        changeStack.push(changes);

        // ...and update the pointer
        pointer = changeStack.length - 1;
      } else {
        // Merge this change with the last in the stack
        const last = changeStack.length - 1;
        changeStack[last] = mergeChanges(changeStack[last], changes);
      }

      lastEvent = now;
    }

    muteEvents = false;
  }

  store.observe(onChange, { origin: Origin.LOCAL });

  const undoCreated = (created: T[]) => 
    created?.length > 0 && store.bulkDeleteAnnotation(created);

  const redoCreated = (created: T[]) =>
    created?.length > 0 && store.bulkAddAnnotation(created, false);

  const undoUpdated = (updated: Update<T>[]) =>
    updated?.length > 0 && store.bulkUpdateAnnotation(updated.map(({ oldValue }) => oldValue));
      
  const redoUpdated = (updated: Update<T>[]) =>
    updated?.length > 0 && store.bulkUpdateAnnotation(updated.map(({ newValue }) => newValue));

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