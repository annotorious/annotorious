import type { ImageAnnotation, ImageAnnotationTarget } from '../model';
import type { AnnotoriousOpts } from '../AnnotoriousOpts';
import { createSpatialTree } from './spatialTree';
import { 
  createViewportState,
  toSvelteStore,
  type AnnotatorState, 
  type HoverState,
  type SelectionState
} from '@annotorious/core';
import { 
  createHoverState, 
  createSelectionState, 
  createStore
} from '@annotorious/core';
import type { 
  ImageAnnotationStore,
  SvelteImageAnnotationStore, 
  SvelteImageAnnotatorState
} from './ImageAnnotationStore';

export type ImageAnnotatorState<T extends ImageAnnotationStore = ImageAnnotationStore> = AnnotatorState<ImageAnnotation> & {

  store: T;

  selection: SelectionState<ImageAnnotation>;

  hover: HoverState<ImageAnnotation>;

}

export const createImageAnnotatorState = <E extends unknown>(
  opts: AnnotoriousOpts<ImageAnnotation, E>
): ImageAnnotatorState<ImageAnnotationStore> => {

  const store = createStore<ImageAnnotation>();

  const tree = createSpatialTree();

  const selection = createSelectionState(store, opts.userSelectAction);

  const hover = createHoverState(store);

  const viewport = createViewportState();

  store.observe(({ changes }) => {
    tree.set((changes.created || []).map(a => a.target as ImageAnnotationTarget), false);
    
    (changes.deleted || []).forEach(a => tree.remove(a.target as ImageAnnotationTarget));
    
    (changes.updated || []).forEach(({ oldValue, newValue }) =>
      tree.update(oldValue.target, newValue.target));
  });

  const getAt = (x: number, y: number): ImageAnnotation | undefined => {
    const target = tree.getAt(x, y);
    return target ? store.getAnnotation(target.annotation) : undefined; 
  }

  const getIntersecting = (x: number, y: number, width: number, height: number) =>
    tree.getIntersecting(x, y, width, height).map(target => store.getAnnotation(target.annotation));

  return {
    store: {
      ...store,
      getAt,
      getIntersecting
    } as ImageAnnotationStore,
    selection,
    hover,
    viewport
  }

}

export const createSvelteImageAnnotatorState = <E extends unknown>(  
  opts: AnnotoriousOpts<ImageAnnotation, E>
): SvelteImageAnnotatorState => {

  const state = createImageAnnotatorState(opts);
  
  return {
    ...state,
    store: toSvelteStore(state.store) as SvelteImageAnnotationStore
  }

}
