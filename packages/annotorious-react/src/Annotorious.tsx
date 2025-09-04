import type { ReactNode } from 'react';
import { dequal } from 'dequal/lite';
import { 
  createContext, 
  forwardRef,
  useContext, 
  useEffect, 
  useImperativeHandle, 
  useRef,
  useState 
} from 'react';
import type { StoreObserveOptions } from '@annotorious/core';
import type {
  Annotation,
  Annotator,
  ImageAnnotation,
  Selection as CoreSelection,
  Store,
  StoreChangeEvent,
  User
} from '@annotorious/annotorious';
import { useDebounce } from './useDebounce';

interface Selection<T extends Annotation = Annotation> extends Omit<CoreSelection, 'selected'> {

  selected: { annotation: T, editable?: boolean }[];

  previous: { annotation: T, editable?: boolean }[];

}

export const AnnotoriousContext = createContext({

  anno: undefined,

  setAnno: undefined,

  annotations: [],

  selection: { selected: [] }

});

const isSelectionEqual = (a: Selection, b: Selection) => {
  const { event: eventA, ...restA } = a; 
  const { event: eventB, ...restB } = b; 

  if (!dequal(restA, restB)) return false;

  return eventA?.timeStamp === eventB?.timeStamp;
}

export const Annotorious = forwardRef<Annotator, { children: ReactNode }>((props: { children: ReactNode }, ref) => {

  const [anno, setAnno] = useState<Annotator>(null);

  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  const [selection, setSelection] = useState<Selection>({ selected: [], previous: [] });

  const previousSelectionRef = useRef<{ annotation: Annotation, editable?: boolean }[]>([]);

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

      const unsubscribeSelection = selection.subscribe(({ selected, ...rest }) => {
        if (selectionStoreObserver)
          store.unobserve(selectionStoreObserver);

        const resolved = (selected || [])
          .map(({ id, editable }) => ({ annotation: store.getAnnotation(id), editable }));

        setSelection(currentSelection => {
          const next = {
            selected: resolved,
            previous: currentSelection.selected,
            ...rest
          } as Selection;

          // Prevent unnecessary re-renders
          if (isSelectionEqual(currentSelection, next))
            return currentSelection;
          
          previousSelectionRef.current = currentSelection.selected;
          
          return next;
        });

        selectionStoreObserver = event => {
          const { updated } = event.changes;

          setSelection((selection) => ({
            ...selection,
            selected: selection.selected.map(({ annotation, editable }) => {
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
  const anno = useAnnotator();
  return anno?.state.store as T | undefined;
}

const _useAnnotations = <T extends Annotation>() => {
  const { annotations } = useContext(AnnotoriousContext);
  return annotations as T[];
}

const _useAnnotationsDebounced = <T extends Annotation>(debounce: number) => {
  const { annotations } = useContext(AnnotoriousContext);
  return useDebounce(annotations, debounce) as T[];
}

export const useAnnotations = <T extends Annotation = ImageAnnotation>(debounce?: number) =>
  debounce ? _useAnnotationsDebounced<T>(debounce) : _useAnnotations<T>();

export const useAnnotation = <T extends Annotation = ImageAnnotation>(
  id: string,
  options?: Omit<StoreObserveOptions, 'annotations'>
) => {
  const store = useAnnotationStore<Store<T>>();

  const [annotation, setAnnotation] = useState<T | undefined>(
    store?.getAnnotation(id)
  );

  useEffect(() => {
    if (!store) return;

    const handleChange = (event: StoreChangeEvent<T>) => {
      const updated = event.changes.updated[0];
      if (updated) {
        setAnnotation(updated.newValue);
      }
    };

    store.observe(handleChange, { ...options, annotations: id });
    return () => store.unobserve(handleChange);
  }, []);

  return annotation;
}

export const useAnnotationSelectAction = <I extends Annotation = ImageAnnotation>(
  id: string
) => {
  const anno = useAnnotator();
  const annotation = useAnnotation<I>(id);
  return anno && annotation ? anno.state.selection.evalSelectAction(annotation) : undefined;
}

export const useSelection = <T extends Annotation = ImageAnnotation>() => {
  const { selection } = useContext(AnnotoriousContext);
  return selection as Selection<T>;
}

export const useHover = <T extends Annotation = ImageAnnotation>() => {
  const anno = useAnnotator();

  const [hover, setHover] = useState<T | undefined>();

  useEffect(() => {
    if (!anno) return;

    const { hover, store } = (anno as Annotator<T, unknown>).state;

    const unsubscribeHover = hover.subscribe(id => {
      if (id) {
        const annotation = store.getAnnotation(id);
        setHover(annotation);
      } else {
        setHover(undefined);
      }
    });

    return () => {
      unsubscribeHover();
    };
  }, [anno]);

  return hover;
}

export const useAnnotatorUser = (): User => {
  const anno = useAnnotator();
  return anno?.getUser();
}

const _useViewportState = <T extends Annotation>() => {
  const anno = useAnnotator();

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
        };

        store.observe(viewportStoreObserver, { annotations: ids });
      });

      return () => {
        unsubscribeViewport();
      };
    }
  }, [anno]);

  return inViewport;
}

const _useViewportStateDebounced = <T extends Annotation>(debounce: number) => {
  const inViewport = _useViewportState();
  return useDebounce(inViewport, debounce) as T[];
}

export const useViewportState = <T extends Annotation = ImageAnnotation>(debounce?: number) =>
  debounce ? _useViewportStateDebounced<T>(debounce) : _useViewportState<T>();
