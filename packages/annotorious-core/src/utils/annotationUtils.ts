import { v4 as uuidv4 } from 'uuid';
import type { Annotation, AnnotationBody } from '../model/Annotation';
import type {  User } from '../model/User';
/**
 * Returns all users listed as creators or updaters in any parts of this
 * annotation.
 */
export const getContributors = (annotation: Annotation): User[] => {
  const { creator, updatedBy } = annotation.target;

  const bodyCollaborators = annotation.bodies.reduce((users, body) =>  (
    [...users, body.creator, body.updatedBy].filter(Boolean) as User[]
  ), [] as User[]);

  return [
    creator,
    updatedBy,
    ...bodyCollaborators
  ].filter(u => u) as User[] // Remove undefined
}

export const createBody = (
  annotation: Annotation, 
  payload: { [key: string]: any },
  created?: Date,
  creator?: User
): AnnotationBody => ({
  id: uuidv4(),
  annotation: annotation.id,
  created: created || new Date(),
  creator,
  ...payload
});