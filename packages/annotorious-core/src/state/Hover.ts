import { atom } from 'nanostores';
import type { Annotation } from '../model';
import type { Store } from './Store';

export type HoverState<T extends Annotation> = ReturnType<typeof createHoverState<T>>;

export const createHoverState = <T extends Annotation>(store: Store<T>) => {

  const hovered = atom<string | null>(null);

  // Track store delete and update events
  store.observe(( { changes }) => {    
    const current = hovered.get();
    if (current) {
      const isDeleted = (changes.deleted || []).some(a => a.id === current);
      if (isDeleted)
        hovered.set(null);
    
      const updated = (changes.updated || []).find(({ oldValue }) => oldValue.id === current);
      if (updated)
        hovered.set(updated.newValue.id);
    }
  });

  return { 
    get current() { return hovered.get() },
    subscribe: hovered.subscribe.bind(hovered), 
    set: hovered.set.bind(hovered)
  };

}
