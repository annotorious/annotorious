import { writable } from 'svelte/store';
import type { Annotation } from '../model';
import type { Store } from './Store';

export type HoverState<T extends Annotation> = ReturnType<typeof createHoverState<T>>;

export const createHoverState = <T extends Annotation>(store: Store<T>) => {

  const { subscribe, set } = writable<string | undefined>();

  let currentHover: string | undefined;

  subscribe(updated => currentHover = updated);

  // Track store delete and update events
  store.observe(( { changes }) => {    
    if (currentHover) {
      const isDeleted = (changes.deleted || []).some(a => a.id === currentHover);
      if (isDeleted)
        set(undefined);
    
      const updated = (changes.updated || []).find(({ oldValue }) => oldValue.id === currentHover);
      if (updated)
        set(updated.newValue.id);
    }
  });

  return { 
    get current() { return currentHover },
    subscribe, 
    set 
  };

}
