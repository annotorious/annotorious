import { v4 as uuidv4 } from 'uuid';
import type { Annotation, AnnotationBody, User } from '../model';

/**
 * Returns all users listed as creators or updaters in any parts of this
 * annotation.
 */
export const getContributors = (annotation: Annotation): User[] => {
  const isUser = (u: unknown): u is User => !!u;

  const targetCollaborators = annotation.targets.flatMap(target => [target.creator, target.updatedBy]).filter(isUser);
  const bodyCollaborators = annotation.bodies.flatMap(body => [body.creator, body.updatedBy]).filter(isUser);

  return [...new Set(targetCollaborators), ... new Set(bodyCollaborators)];
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
