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

type HasTime = { created?: string | Date; updated?: string | Date; };

/** 
 * Converts any string dates in the given annotation(-like) 
 * object to proper Date objects.
 */
export const reviveDates = <A extends Annotation = Annotation>(annotation: any): A => {
  const revive = <T extends HasTime>(body: T): T => {
    const revived = {...body};

    if (body.created && typeof body.created === 'string')
      revived.created = new Date(body.created);

    if (body.updated && typeof body.updated === 'string')
      revived.updated = new Date(body.updated);

    return revived;
  }

  return {
    ...annotation,
    bodies: (annotation.bodies || []).map(revive),
    target: revive(annotation.target)
  } as A;
}

/**
 * Shorthand/helper.
 */
export const createBody = (
  annotationOrId: string | Annotation, 
  payload: { [key: string]: any },
  created?: Date,
  creator?: User
): AnnotationBody => ({
  id: uuidv4(),
  annotation: typeof annotationOrId === 'string' ? annotationOrId : annotationOrId.id,
  created: created || new Date(),
  creator,
  ...payload
});