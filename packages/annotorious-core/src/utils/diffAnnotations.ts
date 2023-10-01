import { dequal } from 'dequal/lite';
import type { Update } from '../state';
import type { Annotation } from '../model';

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
    .filter(({ oldBody }) => oldBody);

const hasTargetChanged = (oldValue: Annotation, newValue: Annotation) => 
  !dequal(oldValue.target, newValue.target);

export const diffAnnotations = <T extends Annotation = Annotation>(oldValue: T, newValue: T): Update<T> => ({
  oldValue, 
  newValue,
  bodiesCreated: getAddedBodies(oldValue, newValue),
  bodiesDeleted: getRemovedBodies(oldValue, newValue),
  bodiesUpdated: getChangedBodies(oldValue, newValue),
  targetUpdated: hasTargetChanged(oldValue, newValue) ? { oldTarget: oldValue.target, newTarget: newValue.target } : undefined
});