import { writable } from 'svelte/store';
import { dequal } from 'dequal/lite';
import type { Annotation, FormatAdapter } from '../model';
import type { Store } from './Store';

export interface Selection {

  selected: { id: string, editable?: boolean }[],

  event?: PointerEvent | KeyboardEvent;

  [key: string]: any; // Allow for additional properties to be added by plugins

}

export type SelectionState<I extends Annotation, E extends unknown> = ReturnType<typeof createSelectionState<I, E>>;

export enum UserSelectAction {

  EDIT = 'EDIT', // Make annotation target(s) editable on pointer select

  SELECT = 'SELECT',  // Just select, but don't make editable

  NONE = 'NONE' // Click won't select - annotation is completely inert

}

export type UserSelectActionExpression<T extends unknown> = UserSelectAction | ((a: T) => UserSelectAction);

const EMPTY: Selection = { selected: [] };

export const createSelectionState = <I extends Annotation, E extends unknown>(
  store: Store<I>,
  defaultSelectionAction?: UserSelectActionExpression<E>,
  adapter?: FormatAdapter<I, E>
) => {
  const { subscribe, set } = writable<Selection>(EMPTY);

  let currentUserSelectAction = defaultSelectionAction;

  let currentSelection: Selection = EMPTY;

  subscribe(updated => currentSelection = updated);

  const clear = () => {
    if (!dequal(currentSelection, EMPTY)) {
      set(EMPTY);
    }
  };

  const isEmpty = () => currentSelection.selected?.length === 0;

  const isSelected = (annotationOrId: I | string) => {
    if (isEmpty())
      return false;

    const id = typeof annotationOrId === 'string' ? annotationOrId : annotationOrId.id;
    return currentSelection.selected.some(i => i.id === id);
  }

  // TODO enable CTRL select
  const userSelect = (id: string, event?: Selection['event']) => {
    const annotation = store.getAnnotation(id);
    if (!annotation) {
      console.warn('Invalid selection: ' + id);
      return;
    }

    const action = onUserSelect(annotation, currentUserSelectAction, adapter);
    switch (action) {
      case UserSelectAction.EDIT:
        set({ selected: [{ id, editable: true }], event });
        break;
      case UserSelectAction.SELECT:
        set({ selected: [{ id }], event });
        break;
      default:
        set({ selected: [], event });
    }
  }

  const setSelected = (idOrIds: string | string[], editable?: boolean) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];

    // Remove invalid
    const annotations = ids
      .map(id => store.getAnnotation(id))
      .filter((a): a is I => Boolean(a));

    set({
      selected: annotations.map(annotation => {
        // If editable is not set, use default behavior
        const isEditable = editable === undefined
          ? onUserSelect(annotation, currentUserSelectAction, adapter) === UserSelectAction.EDIT
          : editable;

        return { id: annotation.id, editable: isEditable }
      })
    });

    if (annotations.length !== ids.length)
      console.warn('Invalid selection', idOrIds);
  }

  const removeFromSelection = (ids: string[]) => {
    if (isEmpty())
      return false;

    const { selected } = currentSelection;

    // Checks which of the given annotations are actually in the selection
    const shouldRemove = selected.some(({ id }) => ids.includes(id));
    if (shouldRemove)
      set({ selected: selected.filter(({ id }) => !ids.includes(id)) });
  }

  const setUserSelectAction = (action: UserSelectActionExpression<E> | undefined) =>
    currentUserSelectAction = action;

  // Track store delete and update events
  store.observe(
    ({ changes }) => removeFromSelection((changes.deleted || []).map(a => a.id))
  );

  return {
    get event() {
      return currentSelection ? currentSelection.event : null;
    },
    get selected() {
      return currentSelection ? [...currentSelection.selected] : null;
    },
    get userSelectAction() {
      return currentUserSelectAction;
    },
    clear,
    isEmpty,
    isSelected,
    setSelected,
    setUserSelectAction,
    subscribe,
    userSelect
  };

}

export const onUserSelect = <I extends Annotation, E extends unknown>(
  annotation: I,
  action?: UserSelectActionExpression<E>,
  adapter?: FormatAdapter<I, E>
): UserSelectAction => {
  const crosswalked = adapter ? adapter.serialize(annotation) : annotation as unknown as E;
  return (typeof action === 'function') ? action(crosswalked) : (action || UserSelectAction.EDIT)
}
