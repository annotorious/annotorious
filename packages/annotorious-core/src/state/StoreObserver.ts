import type { Annotation, AnnotationBody, AnnotationTarget } from '../model';

/** Interface for listening to changes in the annotation store **/
export interface StoreObserver<T extends Annotation> { 

  onChange: { (event: StoreChangeEvent<T>): void };

  options: StoreObserveOptions;

}

/** A change event fired when the store state changes **/
export interface StoreChangeEvent<T extends Annotation> {

  origin: Origin;

  changes: ChangeSet<T>;

  state: T[];

}

export interface ChangeSet<T extends Annotation> {

  created?: T[];

  deleted?: T[];

  updated?: Update<T>[];

}

export interface Update<T extends Annotation> {

  oldValue: T;

  newValue: T;

  bodiesCreated?: AnnotationBody[];

  bodiesDeleted?: AnnotationBody[];

  bodiesUpdated?: Array<{ oldBody: AnnotationBody, newBody: AnnotationBody }>;

  targetUpdated?: { oldTarget: AnnotationTarget, newTarget: AnnotationTarget};

}

/** Options to control which events the observer wants to get notified about **/
export interface StoreObserveOptions {

  // Observe changes on targets, bodies or both?
  ignore?: Ignore;

  // Observe changes on one more specific annotations
  annotations?: string | string[];

  // Observer changes only for a specific origin
  origin?: Origin

}

/** Allows the observer to ignore certain event types **/
export enum Ignore { 

  // Don't notify this observer for changes that involve bodies only
  BODY_ONLY = 'BODY_ONLY',

  // Don't notify for changes on targets only
  TARGET_ONLY = 'TARGET_ONLY'

}

/** Allows the observer to listen only for events that originated locally or from a remote source **/
export enum Origin { 
  
  LOCAL = 'LOCAL', 
  
  REMOTE = 'REMOTE' 

}

/** Tests if this observer should be notified about this event **/
export const shouldNotify = <T extends Annotation>(observer: StoreObserver<T>, event: StoreChangeEvent<T>) => {
  const { changes, origin } = event;

  const isRelevantOrigin = 
    !observer.options.origin || observer.options.origin === origin;

  if (!isRelevantOrigin)
    return false;

  if (observer.options.ignore) {
    const { ignore } = observer.options;

    // Shorthand
    const has = (arg: any[]) => arg?.length > 0;

    const hasAnnotationChanges =
      has(changes.created) || has(changes.deleted);

    if (!hasAnnotationChanges) {
      const hasBodyChanges =
        changes.updated?.some(u => has(u.bodiesCreated) || has(u.bodiesDeleted) || has(u.bodiesUpdated));
    
      const hasTargetChanges = 
        changes.updated?.some(u => u.targetUpdated);

      if (ignore === Ignore.BODY_ONLY && hasBodyChanges && !hasTargetChanges)
        return false;

      if (ignore === Ignore.TARGET_ONLY && hasTargetChanges && !hasBodyChanges)
        return false;
    }
  }

  if (observer.options.annotations) {
    // This observer has a filter set on specific annotations - check affected
    const affectedAnnotations = new Set([
      ...changes.created.map(a => a.id),
      ...changes.deleted.map(a => a.id),
      ...changes.updated.map(({ oldValue }) => oldValue.id)
    ]);

    const observed = Array.isArray(observer.options.annotations) ?
      observer.options.annotations : [ observer.options.annotations ];

    return Boolean(observed.find(id => affectedAnnotations.has(id)));
  } else {
    return true;
  }

}

export const mergeChanges = <T extends Annotation>(event: StoreChangeEvent<T>, toMerge: StoreChangeEvent<T>) => {
  if (event.origin !== toMerge.origin)
    throw 'Cannot merge events from different origins';

  return {
    origin: toMerge.origin,
    changes: {
      // TODO filter created that were deleted in the same go
      created: [...(event.changes.created || []), ...(toMerge.changes.created || []) ],
      deleted: [...(event.changes.deleted || []), ...(toMerge.changes.deleted || []) ] 
      // TODO merge updates
    },
    state: toMerge.state
  }
}