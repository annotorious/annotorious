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

  selected: { annotation: T, editable?: boolean, annotatorId: string }[],

  event?: PointerEvent | KeyboardEvent;

}

// @ts-ignore
export const AnnotoriousManifoldContext = createContext<AnnotoriousManifoldContextValue>();

export interface AnnotoriousManifoldProps {

  crossAnnotatorSelect?: true;

  children: ReactNode;

}

export const AnnotoriousManifold = (props: AnnotoriousManifoldProps) => {

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
        .map(t => ({ annotation: store.getAnnotation(t.id), editable: t.editable, annotatorId: id }));

      // Set the new selection
      if (!muteSelectionEvents.current) {
        if (props.crossAnnotatorSelect) {
          if (resolved.length === 0) {
            setSelection({ selected: [], event });
          } else {
            const isMultiSelect = event?.ctrlKey || event?.metaKey;
            if (isMultiSelect) {
              setSelection(current => {
                const other = current.selected.filter(s => s.annotatorId !== id);
                return {
                  selected: [...resolved, ...other],
                  event
                };
              })
            } else {
              setSelection({ selected: resolved, event });
            }
          }
        } else {
          setSelection({ selected: resolved, event });
        }
      }

      // Track the state of the selected annotations in the store
      selectionStoreObserver = e => {
        const { updated } = e.changes;

        setSelection(({ selected }) => ({
          id: props.crossAnnotatorSelect ? undefined : id,
          selected: selected.map(s => {
            const next = updated.find(u => u.oldValue.id === s.annotation.id);
            return next ? { annotation: next.newValue, editable: s.editable, annotatorId: s.annotatorId } : s;            
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
    muteSelectionEvents.current = true;

    Array.from(annotators.entries()).forEach(([source, anno]) => {
      const currentSelection = new Set(anno.getSelected().map(s => s.id));

      const nextSelection = new Set(selection.selected
        .filter(s => s.annotatorId === source)
        .map(s => s.annotation.id));

      const isEqual = currentSelection.size === nextSelection.size &&
        [...currentSelection].every(id => nextSelection.has(id));

      if (!isEqual)
        anno.setSelected([...nextSelection]);
    });

    muteSelectionEvents.current = false;
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
  const ctx = useContext(AnnotoriousManifoldContext);
  if (ctx)
    return createManifoldInstance(ctx.annotators) as AnnotoriousManifoldInstance<I, E>;
}

export const useAnnotator = <I extends Annotation = Annotation, E extends { id: string } = Annotation>(id: string) => {
  const ctx = useContext(AnnotoriousManifoldContext);
    return ctx.annotators.get(id) as Annotator<I, E>;
}

export const useAnnotations = <T extends Annotation>() => {
  const ctx = useContext(AnnotoriousManifoldContext);
  if (ctx)
    return ctx.annotations as Map<string, T[]>;
}

export const useSelection = <T extends Annotation>() => {
  const ctx = useContext(AnnotoriousManifoldContext);
  if (ctx)
    return ctx.selection as ManifoldSelection<T>;
}
