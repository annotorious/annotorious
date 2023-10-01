import type { Annotation } from './Annotation';
import type { User } from './User';
import type { PresenceProvider } from '../presence';
import type { HoverState, SelectionState, Store, ViewportState } from '../state';
import type { LifecycleEvents } from '../lifecycle';
import type { Formatter } from './Formatter';

/**
 * Base annotator interface.
 * I ... internal core data model 
 * E ... external adapted representation
 */
export interface Annotator<I extends Annotation = Annotation, E extends unknown = Annotation> {

  addAnnotation(annotation: E): void;

  getAnnotationById(id: string): E | undefined;

  getAnnotations(): E[];

  getUser(): User;

  loadAnnotations(url: string): Promise<E[]>;

  setAnnotations(annotations: E[]): void;

  setFormatter(formatter: Formatter): void;

  setUser(user: User): void;

  setPresenceProvider?(provider: PresenceProvider): void;

  on<T extends keyof LifecycleEvents<E>>(event: T, callback: LifecycleEvents<E>[T]): void;

  off<T extends keyof LifecycleEvents<E>>(event: T, callback: LifecycleEvents<E>[T]): void;

  state: AnnotatorState<I>;

}

export interface AnnotatorState<A extends Annotation> {

  store: Store<A>;

  selection: SelectionState<A>;

  hover: HoverState<A>;

  viewport: ViewportState;

}