import type { Annotation } from '../model';
import type { Store } from './Store';
import { type ChangeSet, Origin, type StoreChangeEvent } from './StoreObserver';

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

  const onChange = debounce((event: StoreChangeEvent<T>) => {
    const { changes } = event;

    changeStack.splice(pointer);
    changeStack.push(changes);

    pointer = changeStack.length - 1;
  }, 100);

  store.observe(onChange, { origin: Origin.LOCAL });

  const undo = () => {
    if (pointer > -1) {
      const lastChange = changeStack[pointer];

      console.log('undoing change', lastChange);

      // TODO undo last change

      pointer -= 1;
    }
  }

  const redo = () => {
    if (changeStack.length - 1 > pointer) {
      const nextChange = changeStack[pointer + 1];

      console.log('redoing', nextChange);

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