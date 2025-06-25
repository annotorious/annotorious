import type { ImageAnnotation, ImageAnnotationTarget } from '../model';
import type { AnnotoriousOpts } from '../AnnotoriousOpts';
import { createSpatialTree } from './spatialTree';
import { 
  createViewportState,
  toSvelteStore,
  type Annotation,
  type AnnotatorState, 
  type Filter, 
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

export type ImageAnnotatorState<I extends Annotation = ImageAnnotation, E extends unknown = ImageAnnotation> = AnnotatorState<I, E> & {

  store: ImageAnnotationStore<I>;

  selection: SelectionState<I, E>;

  hover: HoverState<I>;

}

export const createImageAnnotatorState = <I extends Annotation, E extends unknown> (
  opts: AnnotoriousOpts<I, E>
): ImageAnnotatorState<I, E> => {

  const store = createStore<I>();

  const tree = createSpatialTree();

  const selection = createSelectionState<I, E>(store, opts.userSelectAction, opts.adapter);

  const hover = createHoverState(store);

  const viewport = createViewportState();

  store.observe(({ changes }) => {
    tree.set((changes.created || []).map(a => a.target as ImageAnnotationTarget), false);
    
    (changes.deleted || []).forEach(a => tree.remove(a.target as ImageAnnotationTarget));
    
    (changes.updated || []).forEach(({ oldValue, newValue }) => 
      tree.update(oldValue.target, newValue.target));
  });

  const getAt = (x: number, y: number, filter?: Filter<I>, buffer?: number): I | undefined => {
    const targets = tree.getAt(x, y, filter as Filter<Annotation>, buffer);

    if (filter) {
      // Resolve annotations first, so we can filter
      const annotations = targets.map(t => store.getAnnotation(t.annotation)!)
        .filter(Boolean)
        .filter(filter);
        
      return annotations[0];
    } else {
      const top = targets[0];
      return top ? store.getAnnotation(top.annotation) : undefined;
    }
  }

  const getIntersecting = (x: number, y: number, width: number, height: number) =>
    tree.getIntersecting(x, y, width, height)
    .map(target => store.getAnnotation(target.annotation) as I)
    .filter(Boolean); // Race conditions may have deleted annotations concurrently

  return {
    store: {
      ...store,
      getAt,
      getIntersecting
    },
    selection,
    hover,
    viewport
  } as ImageAnnotatorState<I, E>;

}

export const createSvelteImageAnnotatorState = <I extends Annotation, E extends unknown>(  
  opts: AnnotoriousOpts<I, E>
): SvelteImageAnnotatorState<I, E> => {

  const state = createImageAnnotatorState<I, E>(opts);
  
  return {
    ...state,
    store: toSvelteStore(state.store) as SvelteImageAnnotationStore<I>
  }

}
