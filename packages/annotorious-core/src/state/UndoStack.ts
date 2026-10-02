import { createNanoEvents, type Unsubscribe } from 'nanoevents';
import type { Annotation } from '../model';
import type { Store } from './Store';
import { mergeChanges, Origin } from './StoreObserver';
import type { ChangeSet, StoreChangeEvent, Update } from './StoreObserver';

// Duration with fast successive changes get merged 
// with the last event in the stack, rather than getting stacked
// as a new undo/redo step.
const DEBOUNCE = 250;

export interface UndoStack <T extends Annotation> {

  canRedo(): boolean;

  canUndo(): boolean;

  destroy(): void;

  getHistory(): History<T>;

  on<E extends keyof UndoStackEvents<T>>(event: E, callback: UndoStackEvents<T>[E]): Unsubscribe;

  undo(opts?: UndoRedoOptions): void;

  redo(opts?: UndoRedoOptions): void;

  peekRedo(): ChangeSet<T> | undefined;

  peekUndo(): ChangeSet<T> | undefined;

}

export interface UndoRedoOptions {

  // Suppresses local lifecycle events (create/update/delete) on the store
  silent?: boolean;

}

export interface UndoStackEvents <T extends Annotation> {

  redo(change: ChangeSet<T>): void;

  undo(change: ChangeSet<T>): void;

}

export interface History <T extends Annotation> {

  changes: ChangeSet<T>[];
  
  pointer: number;

}

export const createUndoStack = <T extends Annotation>(store: Store<T>, history?: History<T>): UndoStack<T> => {

  const emitter = createNanoEvents<UndoStackEvents<T>>();

  const changeStack: ChangeSet<T>[] = history?.changes || [];

  let pointer = history ? history.pointer : - 1;

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

  const undoCreated = (created?: T[], origin = Origin.LOCAL) =>
    created && created.length > 0 && store.bulkDeleteAnnotations(created, origin);

  const redoCreated = (created?: T[], origin = Origin.LOCAL) =>
    created && created.length > 0 && store.bulkUpsertAnnotations(created, origin);

  const undoUpdated = (updated?: Update<T>[], origin = Origin.LOCAL) =>
    updated && updated.length > 0 && store.bulkUpdateAnnotations(updated.map(({ oldValue }) => oldValue), origin);
      
  const redoUpdated = (updated?: Update<T>[], origin = Origin.LOCAL) =>
    updated && updated.length > 0 && store.bulkUpdateAnnotations(updated.map(({ newValue }) => newValue), origin);

  const undoDeleted = (deleted?: T[], origin = Origin.LOCAL) =>
    deleted && deleted.length > 0 && store.bulkUpsertAnnotations(deleted, origin);

  const redoDeleted = (deleted?: T[], origin = Origin.LOCAL) =>
    deleted && deleted.length > 0 && store.bulkDeleteAnnotations(deleted, origin);

  const undo = (opts?: UndoRedoOptions) => {
    if (pointer > -1) {
      // Silent execution won't trigger the store listener
      if (!opts?.silent) muteEvents = true;

      const { created, updated, deleted } = changeStack[pointer];

      // Origin.REMOTE will trigger the renderer, but not lifecycle events
      const origin = opts?.silent ? Origin.REMOTE : undefined;

      undoCreated(created, origin);
      undoUpdated(updated, origin);
      undoDeleted(deleted, origin);

      emitter.emit('undo', changeStack[pointer]);

      pointer -= 1;
    }
  }

  const canUndo = () => pointer > -1;

  const redo = (opts?: UndoRedoOptions) => {
    if (changeStack.length - 1 > pointer) {
      if (!opts?.silent) muteEvents = true;

      const { created, updated, deleted } = changeStack[pointer + 1];

      const origin = opts?.silent ? Origin.REMOTE : undefined;

      redoCreated(created, origin);
      redoUpdated(updated, origin);
      redoDeleted(deleted, origin);

      emitter.emit('redo', changeStack[pointer + 1]);

      pointer += 1;
    }
  }

  const canRedo = () => changeStack.length - 1 > pointer;

  const destroy = () => store.unobserve(onChange);

  const getHistory = () => ({ changes: structuredClone(changeStack), pointer });

  const peekUndo = () =>
    // structuredClone so consumers can't mutate the history
    canUndo() ? structuredClone(changeStack[pointer]) : undefined;

  const peekRedo = () =>
    canRedo() ? structuredClone(changeStack[pointer + 1]) : undefined;

  const on = <E extends keyof UndoStackEvents<T>>(event: E, callback: UndoStackEvents<T>[E]) => 
    emitter.on(event, callback);

  return {
    canRedo,
    canUndo,
    destroy,
    getHistory,
    on,
    redo,
    undo,
    peekRedo,
    peekUndo
  }

}
