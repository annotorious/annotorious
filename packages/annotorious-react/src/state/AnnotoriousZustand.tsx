import { forwardRef, ReactNode, useEffect, useImperativeHandle, useState } from 'react';
import { create } from 'zustand';
import { onUserSelect } from '@annotorious/core';
import type { StoreObserveOptions, UserSelectActionExpression } from '@annotorious/core';
import { useDebounce } from '../useDebounce';
import type {
  Annotation,
  Annotator,
  Selection as CoreSelection,
  ImageAnnotation,
  Store,
  StoreChangeEvent,
  User
} from '@annotorious/annotorious';

interface Selection<T extends Annotation = Annotation> extends Omit<CoreSelection, 'selected'> {
  selected: { annotation: T; editable?: boolean }[];
}

interface AnnotoriousState {
  anno: Annotator | null;
  annotations: Annotation[];
  selection: Selection;
  hover: Annotation | undefined;
  inViewport: Annotation[];
  setAnno: (anno: Annotator) => void;
}

// Create the Zustand store
const useAnnotoriousStore = create<AnnotoriousState>((set, get) => ({
  anno: null,
  annotations: [],
  selection: { selected: [] },
  hover: undefined,
  inViewport: [],
  setAnno: (anno: Annotator) => {
    set({ anno });

    const { store, selection, hover, viewport } = anno.state;

    // Initialize with existing annotations
    if (store.all().length > 0) {
      set({ annotations: store.all() });
    }

    // Keep annotations in sync
    store.observe(() => set({ annotations: store.all() }));

    // Keep selection in sync
    selection.subscribe(({ selected, ...rest }) => {
      const resolved = (selected || []).map(({ id, editable }) => ({
        annotation: store.getAnnotation(id),
        editable,
      }));
      set({ selection: { selected: resolved, ...rest } });

      // Update selection when underlying annotations change
      store.observe(
        (event) => {
          const { updated } = event.changes;
          set((state) => ({
            selection: {
              ...state.selection,
              selected: state.selection.selected.map(({ annotation, editable }) => {
                const next = updated.find((u) => u.oldValue.id === annotation.id);
                return next ? { annotation: next.newValue, editable } : { annotation, editable };
              }),
            },
          }));
        },
        { annotations: selected.map(({ id }) => id) }
      );
    });

    // Keep hover state in sync
    hover.subscribe((id) => {
      if (id) {
        const annotation = store.getAnnotation(id);
        set({ hover: annotation });
      } else {
        set({ hover: undefined });
      }
    });

    // Keep viewport state in sync
    if (viewport) {
      viewport.subscribe((ids) => {
        const resolved = ids.map((id) => store.getAnnotation(id));
        set({ inViewport: resolved });

        store.observe(
          (event) => {
            const { updated } = event.changes;
            set((state) => ({
              inViewport: state.inViewport.map((annotation) => {
                const next = updated.find((u) => u.oldValue.id === annotation.id);
                return next ? next.newValue : annotation;
              }),
            }));
          },
          { annotations: ids }
        );
      });
    }
  },
}));

// Custom hooks that use the store
export const useAnnotator = <T extends unknown = Annotator<any, unknown>>() => {
  return useAnnotoriousStore((state) => state.anno) as T;
};

export const useAnnotationStore = <T extends unknown = Store<Annotation>>() => {
  const anno = useAnnotoriousStore((state) => state.anno);
  return anno?.state.store as T | undefined;
};

export const useAnnotations = <T extends Annotation = ImageAnnotation>(debounce?: number) => {
  const annotations = useAnnotoriousStore((state) => state.annotations) as T[];
  return debounce ? useDebounce(annotations, debounce) : annotations;
};

export const useAnnotation = <T extends Annotation = ImageAnnotation>(
  id: string,
  options?: Omit<StoreObserveOptions, 'annotations'>
) => {
  const store = useAnnotationStore<Store<T>>();
  const [annotation, setAnnotation] = useState<T | undefined>(store?.getAnnotation(id));

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
  }, [store, id]);

  return annotation;
};

export const useAnnotationSelectAction = <
  I extends Annotation = ImageAnnotation,
  E extends unknown = ImageAnnotation
>(
  id: string,
  action: UserSelectActionExpression<E>
) => {
  const annotation = useAnnotation<I>(id);
  return annotation ? onUserSelect<I, E>(annotation, action) : undefined;
};

export const useSelection = <T extends Annotation = ImageAnnotation>() => {
  return useAnnotoriousStore((state) => state.selection) as Selection<T>;
};

export const useHover = <T extends Annotation = ImageAnnotation>() => {
  return useAnnotoriousStore((state) => state.hover) as T | undefined;
};

export const useAnnotatorUser = (): User => {
  const anno = useAnnotoriousStore((state) => state.anno);
  return anno?.getUser();
};

export const useViewportState = <T extends Annotation = ImageAnnotation>(debounce?: number) => {
  const inViewport = useAnnotoriousStore((state) => state.inViewport) as T[];
  return debounce ? useDebounce(inViewport, debounce) : inViewport;
};

// Provider component (much simpler now!)
export const Annotorious = forwardRef<Annotator, { children: ReactNode }>(
  (props: { children: ReactNode }, ref) => {
    const setAnno = useAnnotoriousStore((state) => state.setAnno);
    const anno = useAnnotoriousStore((state) => state.anno);

    useImperativeHandle(ref, () => anno);

    return props.children;
  }
);