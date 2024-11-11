import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Annotation, Annotator } from '@annotorious/react';
import type { StoreChangeEvent } from '@annotorious/react';
import { AnnotoriousManifoldInstance, createManifoldInstance } from './AnnotoriousManifoldInstance';

interface AnnotoriousManifoldContextValue {

  annotators: Map<string, Annotator<any, { id: string }>>;

  annotations: Map<string, Annotation[]>;

  selection: ManifoldSelection;

  connectAnnotator(source: string, anno: Annotator<any, { id: string }>): () => void;

}

interface ManifoldSelection<T extends Annotation = Annotation> {

  id?: string;

  selected: { annotation: T, editable?: boolean }[],

  event?: PointerEvent | KeyboardEvent;

}

// @ts-ignore
export const AnnotoriousManifoldContext = createContext<AnnotoriousManifoldContextValue>();

export const AnnotoriousManifold = (props: { children: ReactNode }) => {

  const [annotators, setAnnotators] = useState<Map<string, Annotator<any, { id: string }>>>(new Map());

  const [annotations, setAnnotations] = useState<Map<string, Annotation[]>>(new Map());

  const [selection, setSelection] = 
    useState<ManifoldSelection>({ selected: [] });

  // To prevent selection state updates when de-selecting other annotators
  const muteSelectionEvents = useRef<boolean>(false);

  const connectAnnotator = (id: string, anno: Annotator<any, { id: string }>) => {
    // Add the annotator to the state
    setAnnotators(m => new Map(m.entries()).set(id, anno))

    const { store } = anno.state;

    const selectionState = anno.state.selection;

    // Add the annotations to the state
    setAnnotations(m => new Map(m.entries()).set(id, store.all()));

    const onStoreChange = () =>
      setAnnotations(m => new Map(m.entries()).set(id, store.all()));

    store.observe(onStoreChange);

    // Track selection
    let selectionStoreObserver: (event: StoreChangeEvent<Annotation>) => void;

    const unsubscribeSelection = selectionState.subscribe(({ selected, event }) => {
      if (selectionStoreObserver) 
        store.unobserve(selectionStoreObserver);

      const resolved = (selected || [])
        .map(({ id, editable }) => ({ annotation: store.getAnnotation(id), editable }));

      // Set the new selection
      if (!muteSelectionEvents.current)
        setSelection({ id, selected: resolved, event });

      // Track the state of the selected annotations in the store
      selectionStoreObserver = e => {
        const { updated } = e.changes;

        setSelection(({ id, selected }) => ({
          id,
          selected: selected.map(({ annotation, editable }) => {
            const next = updated.find(u => u.oldValue.id === annotation.id);
            return next ? { annotation: next.newValue, editable } : { annotation, editable };
          }),
          event
        }));
      }

      store.observe(selectionStoreObserver, { annotations: selected.map(({ id }) => id) });
    });

    return () => {
      // Remove annotator
      setAnnotators(m => new Map(Array.from(m.entries()).filter(([key, _]) => key !== id)));

      // Remove & untrack annotations
      setAnnotations(m => new Map(Array.from(m.entries()).filter(([key, _]) => key !== id)));
      store.unobserve(onStoreChange);

      // Un-track selection
      unsubscribeSelection();
    }
  }

  useEffect(() => {
    if (selection.id) {
      muteSelectionEvents.current = true;

      Array.from(annotators.entries()).forEach(([source, anno]) => {
        if (source !== selection.id)
          anno.setSelected();
      });

      muteSelectionEvents.current = false;
    }
  }, [selection, annotators]);

  return (
    <AnnotoriousManifoldContext.Provider value={{   
      annotators, 
      annotations,
      selection,
      connectAnnotator 
    }}>
      {props.children}
    </AnnotoriousManifoldContext.Provider>
  )

}

export const useAnnotoriousManifold = <I extends Annotation = Annotation, E extends { id: string } = Annotation>() => {
  const { annotators } = useContext(AnnotoriousManifoldContext);
  return createManifoldInstance(annotators) as AnnotoriousManifoldInstance<I, E>;
}

export const useAnnotator = <I extends Annotation = Annotation, E extends { id: string } = Annotation>(id: string) => {
  const { annotators } = useContext(AnnotoriousManifoldContext);
  return annotators.get(id) as Annotator<I, E>;
}

export const useAnnotations = <T extends Annotation>() => {
  const { annotations } = useContext(AnnotoriousManifoldContext);
  return annotations as Map<string, T[]>;
}

export const useSelection = <T extends Annotation>() => {
  const { selection } = useContext(AnnotoriousManifoldContext);
  return selection as ManifoldSelection<T>;
}
