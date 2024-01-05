import { dequal } from 'dequal/lite';
import type { Update } from '../state/StoreObserver';
import type { Annotation } from '../model/Annotation';

const getAddedBodies = (oldValue: Annotation, newValue: Annotation) => {
  const oldBodyIds = new Set(oldValue.bodies.map(b => b.id));
  return newValue.bodies.filter(b => !oldBodyIds.has(b.id));
}

const getRemovedBodies = (oldValue: Annotation, newValue: Annotation) => {
  const newBodyIds = new Set(newValue.bodies.map(b => b.id));
  return oldValue.bodies.filter(b => !newBodyIds.has(b.id));
}

const getChangedBodies = (oldValue: Annotation, newValue: Annotation) => 
  newValue.bodies
    .map(newBody => {
      const oldBody = oldValue.bodies.find(b => b.id === newBody.id);
      return { newBody, oldBody: oldBody && !dequal(oldBody, newBody) ? oldBody : undefined }
    })
    .filter(({ oldBody }) => oldBody)
    .map(({ oldBody, newBody }) => ({ oldBody: oldBody!, newBody }));

const hasTargetChanged = (oldValue: Annotation, newValue: Annotation) => 
  !dequal(oldValue.target, newValue.target);

export const diffAnnotations = <T extends Annotation = Annotation>(oldValue: T, newValue: T): Update<T> => {
  const bodiesCreated = getAddedBodies(oldValue, newValue);
  const bodiesDeleted = getRemovedBodies(oldValue, newValue);
  const bodiesUpdated = getChangedBodies(oldValue, newValue);

  return {
    oldValue, 
    newValue,
    bodiesCreated: bodiesCreated.length > 0 ? bodiesCreated : undefined,
    bodiesDeleted: bodiesDeleted.length > 0 ? bodiesDeleted : undefined,
    bodiesUpdated: bodiesUpdated.length > 0 ? bodiesUpdated : undefined,
    targetUpdated: hasTargetChanged(oldValue, newValue) ? { oldTarget: oldValue.target, newTarget: newValue.target } : undefined
  }
}