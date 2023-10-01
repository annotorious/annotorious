import { writable } from 'svelte/store';

export type ViewportState = ReturnType<typeof createViewportState>;

export const createViewportState = () => {

  const { subscribe, set } = writable<string[]>([]);

  return { 
    subscribe, 
    set
  };

}
