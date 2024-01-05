import { writable } from 'svelte/store';
import type {  Annotation } from '../model';
import type { Store } from './Store';
   
export type Selection = {

  selected: { id: string, editable?: boolean }[],

  pointerEvent?: PointerEvent;

}

export type SelectionState<T extends Annotation> = ReturnType<typeof createSelectionState<T>>;

export enum PointerSelectAction {

  EDIT = 'EDIT', // Make annotation target(s) editable on pointer select
  
  SELECT = 'SELECT',  // Just select, but don't make editable

  NONE = 'NONE' // Click won't select - annotation is completely inert

}

const EMPTY: Selection = { selected: [] };

export const createSelectionState = <T extends Annotation>(
  store: Store<T>,
  selectAction: PointerSelectAction | ((a: T) => PointerSelectAction) = PointerSelectAction.EDIT
) => {
  const { subscribe, set } = writable<Selection>(EMPTY);

  let currentSelection: Selection = EMPTY;

  subscribe(updated => currentSelection = updated);

  const clear = () => set(EMPTY);

  const isEmpty = () => currentSelection.selected?.length === 0;

  const isSelected = (annotationOrId: T | string) => {
    if (currentSelection.selected.length === 0)
      return false;

    const id = typeof annotationOrId === 'string' ? annotationOrId : annotationOrId.id;
    return currentSelection.selected.some(i => i.id === id);
  }

  // TODO enable CTRL select
  const clickSelect = (id: string, pointerEvent: PointerEvent) => {
    const annotation = store.getAnnotation(id);
    if (annotation) {
      const action = onPointerSelect(annotation, selectAction);
      if (action === PointerSelectAction.EDIT)
        set({ selected: [{ id, editable: true }], pointerEvent }); 
      else if (action === PointerSelectAction.SELECT)
        set({ selected: [{ id }], pointerEvent }); 
      else
        set({ selected: [], pointerEvent });
    } else {
      console.warn('Invalid selection: ' + id);
    }
  }

  const setSelected = (idOrIds: string | string[], editable: boolean = true) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];

    // Remove invalid
    const annotations = 
      ids.map(id => store.getAnnotation(id)!).filter(Boolean); 

    set({ selected: annotations.map(({ id }) => ({ id, editable })) });
    
    if (annotations.length !== ids.length)
      console.warn('Invalid selection', idOrIds);
  }

  const removeFromSelection = (ids: string[]) => {
    if (currentSelection.selected.length === 0)
      return false;

    const { selected } = currentSelection;

    // Checks which of the given annotations are actually in the selection
    const toRemove = selected.filter(({ id  }) => ids.includes(id))

    if (toRemove.length > 0)
      set({ selected: selected.filter(({ id }) => !ids.includes(id)) });
  }

  // Track store delete and update events
  store.observe(({ changes }) =>
    removeFromSelection((changes.deleted || []).map(a => a.id)));

  return { 
    clear, 
    clickSelect, 
    get selected() { return currentSelection ? [...currentSelection.selected ] : null},
    get pointerEvent() { return currentSelection ? currentSelection.pointerEvent : null },
    isEmpty, 
    isSelected, 
    setSelected, 
    subscribe 
  };

}

export const onPointerSelect = <T extends Annotation>(
  annotation: T, 
  action?: PointerSelectAction | ((a: T) => PointerSelectAction)
): PointerSelectAction => (typeof action === 'function') ?
    (action(annotation) || PointerSelectAction.EDIT) : 
    (action || PointerSelectAction.EDIT);
