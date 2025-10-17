import { atom } from 'nanostores';
import { dequal } from 'dequal/lite';
import type { Annotation, FormatAdapter } from '../model';
import type { Store } from './Store';

export interface Selection {

  selected: { id: string, editable?: boolean }[],

  event?: PointerEvent | KeyboardEvent;

}

export type SelectionState<I extends Annotation, E extends unknown> = ReturnType<typeof createSelectionState<I, E>>;

export enum UserSelectAction {

  EDIT = 'EDIT', // Make annotation target(s) editable on pointer select

  SELECT = 'SELECT',  // Just select, but don't make editable

  NONE = 'NONE' // Click won't select - the annotation is completely inert

}

export type UserSelectActionExpression<T extends unknown> = UserSelectAction | ((a: T) => UserSelectAction);

const EMPTY: Selection = { selected: [] };

export const createSelectionState = <I extends Annotation, E extends unknown>(
  store: Store<I>,
  defaultSelectionAction?: UserSelectActionExpression<E>,
  adapter?: FormatAdapter<I, E>
) => {
  const selection = atom<Selection>(EMPTY);

  let currentUserSelectAction = defaultSelectionAction;

  const clear = () => {
    if (!dequal(selection.get(), EMPTY))
      selection.set(EMPTY);
  };

  const isEmpty = () => selection.get().selected?.length === 0;

  const isSelected = (annotationOrId: I | string) => {
    if (isEmpty())
      return false;

    const id = typeof annotationOrId === 'string' ? annotationOrId : annotationOrId.id;
    return selection.get().selected.some(i => i.id === id);
  }

  const userSelect = (idOrIds: string | string[], event?: Selection['event']) => {
    let annotations: I[];

    if (Array.isArray(idOrIds)) {
      annotations = idOrIds.map(id => store.getAnnotation(id)!).filter(Boolean);

      if (annotations.length < idOrIds.length) {
        console.warn('Invalid selection: ' + idOrIds.filter(id => !annotations.some(a => a.id === id)));
        return;
      }
    } else {
      const annotation = store.getAnnotation(idOrIds);
      if (!annotation) {
        console.warn('Invalid selection: ' + idOrIds);
        return;
      }

      annotations = [annotation];
    }

    const selected = annotations.reduce<{ id: string, editable?: boolean }[]>((sel, a) => {
      const action = evalSelectAction(a);
      if (action === UserSelectAction.EDIT)
        return [...sel, { id: a.id, editable: true }];
      else if (action === UserSelectAction.SELECT) 
        return [...sel, { id: a.id }];
      else
        return sel;
    }, []);

    selection.set({ selected, event });
  }

  const setSelected = (idOrIds: string | string[], editable?: boolean) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];

    // Remove invalid
    const annotations = ids
      .map(id => store.getAnnotation(id))
      .filter((a): a is I => Boolean(a));

    selection.set({
      selected: annotations.map(annotation => {

        // If editable isn't set, use the default behavior
        const isEditable = editable === undefined
          ? evalSelectAction(annotation) === UserSelectAction.EDIT
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

    const { selected } = selection.get();

    // Checks which of the given annotations are actually in the selection
    const shouldRemove = selected.some(({ id }) => ids.includes(id));
    if (shouldRemove)
      selection.set({ selected: selected.filter(({ id }) => !ids.includes(id)) });
  }

  const setUserSelectAction = (action: UserSelectActionExpression<E> | undefined) => {
    currentUserSelectAction = action;
    setSelected(selection.get().selected.map(({ id }) => id));
  };

  // Utility to evaluate what the select action will be for the given annotation
  const evalSelectAction = (annotation: I) =>
    onUserSelect(annotation, currentUserSelectAction, adapter)

  // Track store delete and update events
  store.observe(
    ({ changes }) => removeFromSelection((changes.deleted || []).map(a => a.id))
  );

  return {
    get event() {
      const current = selection.get();
      return current ? current.event : null;
    },
    get selected() {
      const current = selection.get();
      return current ? [...current.selected] : null;
    },
    get userSelectAction() {
      return currentUserSelectAction;
    },
    clear,
    evalSelectAction,
    isEmpty,
    isSelected,
    setSelected,
    setUserSelectAction,
    subscribe: selection.subscribe.bind(selection),
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
