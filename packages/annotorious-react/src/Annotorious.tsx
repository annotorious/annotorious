import { createContext, forwardRef, ReactNode} from 'react';
import { useContext, useEffect, useImperativeHandle, useState } from 'react';
import { Annotation, Annotator, Store, StoreChangeEvent } from '@annotorious/annotorious';
import { useDebounce } from './useDebounce';

interface Selection<T extends Annotation = Annotation> {

  selected: { annotation: T, editable?: boolean }[];

  pointerEvent?: PointerEvent;

}

export interface AnnotoriousContextState {

  anno: Annotator;

  setAnno(anno: Annotator<Annotation, unknown>): void;

  annotations: Annotation[];

  selection: Selection;

}

export const AnnotoriousContext = createContext({ 

  anno: undefined, 

  setAnno: undefined, 

  annotations: [], 

  selection: { selected: [] }

});

export const Annotorious = forwardRef<Annotator, { children: ReactNode }>((props: { children: ReactNode }, ref) => {

  const [anno, setAnno] = useState<Annotator>(null);

  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  const [selection, setSelection] = useState<Selection>({ selected: [] });

  useImperativeHandle(ref, () => anno);

  useEffect(() => {
    if (anno) {
      const { selection, store } = anno.state;

      // Components below <Annotorious /> may have
      // loaded annotations into the store already! 
      if (store.all().length > 0)
        setAnnotations(store.all());

      // Keeps annotations in sync with a React state,
      // so clients can render components the usual React way.
      const onStoreChange = () => setAnnotations(() => store.all());

      store.observe(onStoreChange);

      // Keep selection in sync with a react state, and resolve them
      // from IDs to annotations automatically, for convenience
      let selectionStoreObserver: (event: StoreChangeEvent<Annotation>) => void;

      const unsubscribeSelection = selection.subscribe(({ selected, pointerEvent }) => {
        if (selectionStoreObserver) 
          store.unobserve(selectionStoreObserver);

        const resolved = (selected || [])
          .map(({ id, editable }) => ({ annotation: store.getAnnotation(id), editable }));

        setSelection({ selected: resolved, pointerEvent });

        selectionStoreObserver = event => {
          const { updated } = event.changes;

          setSelection(({ selected }) => ({
            selected: selected.map(({ annotation, editable }) => {
              const next = updated.find(u => u.oldValue.id === annotation.id);
              return next ? { annotation: next.newValue, editable } : { annotation, editable };
            })
          }));
        }

        store.observe(selectionStoreObserver, { annotations: selected.map(({ id }) => id) });
      });

      return () => {
        store.unobserve(onStoreChange);
        unsubscribeSelection();
      }
    }
  }, [anno]);

  return (
    <AnnotoriousContext.Provider value={{ 
      anno, 
      setAnno,
      annotations, 
      selection 
    }}>
       {props.children}
    </AnnotoriousContext.Provider>
  )

});

export const useAnnotator = <T extends unknown = Annotator<any, unknown>>() => {
  const { anno } = useContext(AnnotoriousContext);
  return anno as T;
}

export const useAnnotationStore = <T extends unknown = Store<Annotation>>() => {
  const { anno } = useContext(AnnotoriousContext);
  return anno?.state.store as T | undefined;
}

const _useAnnotations = <T extends Annotation>() => {
  const { annotations } = useContext(AnnotoriousContext);
  return annotations as T[];
}

const _useAnnotationsDebouced = <T extends Annotation>(debounce: number) => {
  const { annotations } = useContext(AnnotoriousContext);
  return useDebounce(annotations, debounce) as T[];
}

export const useAnnotations = <T extends Annotation>(debounce?: number) =>
  debounce ? _useAnnotationsDebouced<T>(debounce) : _useAnnotations<T>();

export const useSelection = <T extends Annotation>() => {
  const { selection } = useContext(AnnotoriousContext);
  return selection as Selection<T>;
}

export const useAnnotatorUser = () => {
  const { anno } = useContext(AnnotoriousContext);
  return anno?.getUser();
}

const _useViewportState = <T extends Annotation>() => {
  const { anno } = useContext(AnnotoriousContext);

  const [inViewport, setInViewport] = useState<T[]>([]);

  useEffect(() => {
    if (anno) {
      const { store, viewport } = anno.state;

      if (!viewport)
        return;

      // Keep viewport annotations in sync with a react state, and resolve them
      // from IDs to annotations automatically, for convenience
      let viewportStoreObserver: (event: StoreChangeEvent<T>) => void;

      const unsubscribeViewport = viewport.subscribe(ids => {
        if (viewportStoreObserver) 
          store.unobserve(viewportStoreObserver);

        const resolved = ids.map(id => store.getAnnotation(id)) as T[];
        setInViewport(resolved);

        viewportStoreObserver = event => {
          const { updated } = event.changes;

          setInViewport(annotations => annotations.map(annotation => {
            const next = updated.find(u => u.oldValue.id === annotation.id);
            return next ? next.newValue : annotation;
          }));
        }

        store.observe(viewportStoreObserver, { annotations: ids });
      });

      return () => {
        unsubscribeViewport();
      }
    }
  }, [anno]);

  return inViewport;
}

const _useViewportStateDebounced =  <T extends Annotation>(debounce: number) => {
  const inViewport = _useViewportState();
  return useDebounce(inViewport, debounce) as T[];
}

export const useViewportState =  <T extends Annotation>(debounce?: number) =>
  debounce ? _useViewportStateDebounced<T>(debounce) : _useViewportState<T>();
