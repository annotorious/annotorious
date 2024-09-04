import type { ImageAnnotation, ImageAnnotationTarget } from '../model';
import type { AnnotoriousOpts } from '../AnnotoriousOpts';
import { createSpatialTree } from './spatialTree';
import { 
  createViewportState,
  toSvelteStore,
  type Annotation,
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

export type ImageAnnotatorState<I extends Annotation = ImageAnnotation> = AnnotatorState<I> & {

  store: ImageAnnotationStore<I>;

  selection: SelectionState<ImageAnnotation>;

  hover: HoverState<ImageAnnotation>;

}

export const createImageAnnotatorState = <I extends Annotation, E extends unknown> (
  opts: AnnotoriousOpts<I, E>
): ImageAnnotatorState<I> => {

  const store = createStore<I>();

  const tree = createSpatialTree();

  const selection = createSelectionState<I>(store, opts.userSelectAction);

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
    return target ? store.getAnnotation(target.annotation) as unknown as ImageAnnotation : undefined; 
  }

  const getIntersecting = (x: number, y: number, width: number, height: number) =>
    tree.getIntersecting(x, y, width, height).map(target => store.getAnnotation(target.annotation) as unknown as ImageAnnotation);

  return {
    store: {
      ...store,
      getAt,
      getIntersecting
    },
    selection,
    hover,
    viewport
  } as ImageAnnotatorState<I>;

}

export const createSvelteImageAnnotatorState = <I extends Annotation, E extends unknown>(  
  opts: AnnotoriousOpts<I, E>
): SvelteImageAnnotatorState<I> => {

  const state = createImageAnnotatorState(opts);
  
  return {
    ...state,
    store: toSvelteStore(state.store) as SvelteImageAnnotationStore<I>
  }

}
