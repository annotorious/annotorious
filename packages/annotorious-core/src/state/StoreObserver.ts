import type { Annotation, AnnotationBody, AnnotationTarget } from '../model/Annotation';
import { diffAnnotations } from '../utils';

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

  targetsUpdated?: Array<{ oldTarget: AnnotationTarget, newTarget: AnnotationTarget}>;

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
    const has = (arg: any[] | undefined) => arg && arg.length > 0;

    const hasAnnotationChanges =
      has(changes.created) || has(changes.deleted);

    if (!hasAnnotationChanges) {
      const hasBodyChanges =
        changes.updated?.some(u => has(u.bodiesCreated) || has(u.bodiesDeleted) || has(u.bodiesUpdated));
    
      const hasTargetChanges = 
        changes.updated?.some(u => has(u.targetsUpdated));

      if (ignore === Ignore.BODY_ONLY && hasBodyChanges && !hasTargetChanges)
        return false;

      if (ignore === Ignore.TARGET_ONLY && hasTargetChanges && !hasBodyChanges)
        return false;
    }
  }

  if (observer.options.annotations) {
    // This observer has a filter set on specific annotations - check affected
    const affectedAnnotations = new Set([
      ...(changes.created || []).map(a => a.id),
      ...(changes.deleted || []).map(a => a.id),
      ...(changes.updated || []).map(({ oldValue }) => oldValue.id)
    ]);

    const observed = Array.isArray(observer.options.annotations) ?
      observer.options.annotations : [ observer.options.annotations ];

    return Boolean(observed.find(id => affectedAnnotations.has(id)));
  } else {
    return true;
  }

}

export const mergeChanges = <T extends Annotation>(changes: ChangeSet<T>, toMerge: ChangeSet<T>) => {
  const previouslyCreatedIds = new Set((changes.created || []).map(a => a.id));
  const previouslyUpdatedIds = new Set((changes.updated || []).map(({ newValue }) => newValue.id));

  const createdIds = new Set((toMerge.created || []).map(a => a.id));
  const deletedIds = new Set((toMerge.deleted || []).map(a => a.id));
  const updatedIds = new Set((toMerge.updated || []).map(({ oldValue }) => oldValue.id));

  // Updates that will be merged into create or previous update events
  const mergeableUpdates = new Set((toMerge.updated || [])
    .filter(({ oldValue }) => previouslyCreatedIds.has(oldValue.id) || previouslyUpdatedIds.has(oldValue.id))
    .map(({ oldValue }) => oldValue.id));

  // * created *
  // - drop created that were then deleted
  // - merge any updates on created
  // - append newly created
  const created = [
    ...(changes.created || [])
      .filter(a => !deletedIds.has(a.id))
      .map(a => updatedIds.has(a.id)
        ? toMerge.updated!.find(({ oldValue }) => oldValue.id === a.id)!.newValue
        : a),
    ...(toMerge.created || [])
  ];

  // * deleted *
  // - drop deleted that were later re-created (redo action!)
  // - append newly deleted, but remove any that delete annotations 
  //   that were created in the same round
  const deleted = [
    ...(changes.deleted || [])
      .filter(a => !createdIds.has(a.id)),
    ...(toMerge.deleted || [])
      .filter(a => !previouslyCreatedIds.has(a.id))
  ];

  // * updated *
  // - drop updates on deleted annotations
  // - merge any updates that override previous ones
  // - append new updates, but remove any that were merged
  const updated = [
    ...(changes.updated || [])
      .filter(({ newValue }) => !deletedIds.has(newValue.id))
      .map(update => {
        const { oldValue, newValue } = update;
        if (updatedIds.has(newValue.id)) {
          const updated = toMerge.updated!.find(u => u.oldValue.id === newValue.id)!.newValue;
          return diffAnnotations(oldValue, updated);
        } else {
          return update;
        }
      }),
    ...(toMerge.updated || []).filter(({ oldValue }) => !mergeableUpdates.has(oldValue.id))
  ];

  return { created, deleted, updated };
};
