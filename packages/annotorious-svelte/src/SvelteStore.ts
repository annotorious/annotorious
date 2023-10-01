import type { Annotation, Annotator, AnnotatorState, Store, StoreChangeEvent } from '@annotorious/core/src';

type Subscriber<T extends Annotation> = (annotation: T[]) => void; 

export interface SvelteStore<T extends Annotation> extends Store<T> {

  subscribe(onChange: Subscriber<T>): void;

}

export interface SvelteAnnotatorState<T extends Annotation> extends AnnotatorState<T> {

  store: SvelteStore<T>

}

export interface SvelteAnnotator<T extends Annotation> extends Annotator<T> {

  state: SvelteAnnotatorState<T>

}

/** 
 * A simple wrapper around the event-based store implementation
 * that adds a Svelte shim, for use with the reactive '$' notation.
 * Other frameworks might not actually need this. But it's pretty
 * convenient for everyone using Svelte, as well as for the
 * basic (Svelte-based) Annotorious standard implementation.
 */
export const toSvelteStore = <T extends Annotation>(store: Store<T>): SvelteStore<T> => {

  const subscribe = (onChange: Subscriber<T>) => {

    // Register a store observer on behalf of the subscriber
    const shim = (event: StoreChangeEvent<T>) => onChange(event.state);
    store.observe(shim);

    // Immediately call the subscriber function with the
    // current store value, according to the Svelte contract.
    // https://stackoverflow.com/questions/68220955/how-does-svelte-unsubscribe-actually-work
    onChange(store.all());

    // Return the unsubscribe function
    return () => store.unobserve(shim);
  }

  return {
    ...store,
    subscribe
  }

}