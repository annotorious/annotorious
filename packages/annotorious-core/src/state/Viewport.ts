import { atom } from 'nanostores';

export type ViewportState = ReturnType<typeof createViewportState>;

export const createViewportState = () => {

  const inViewport = atom<string[]>([]);

  return { 
    subscribe: inViewport.subscribe.bind(inViewport), 
    set: inViewport.set.bind(inViewport)
  };

}
