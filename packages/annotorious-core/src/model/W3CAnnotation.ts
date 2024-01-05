import type { AnnotationBody } from './Annotation';

export interface W3CAnnotation {

  '@context': 'http://www.w3.org/ns/anno.jsonld';

  type: 'Annotation';

  id: string;

  created?: string;

  creator?: W3CUser;

  modified?: string;

  body: W3CAnnotationBody | W3CAnnotationBody[];

  target: W3CAnnotationTarget | W3CAnnotationTarget[];

  [key: string]: any;

}

export interface W3CUser {

  type?: string;

  id: string;

  name?: string;

}

export interface W3CAnnotationBody {

  type?: string;

  id?: string;

  purpose?: string;

  value?: string;

  source?: string;

  created?: string;

  creator?: W3CUser;

}

export interface W3CAnnotationTarget {

  source: string;

  selector?: W3CSelector | W3CSelector[];

}

export interface W3CSelector {

  type: string;

  conformsTo?: string;

  value: string;

}

// https://stackoverflow.com/questions/6122571/simple-non-secure-hash-function-for-javascript
const hashCode = (obj: Object): string => {
  const str = JSON.stringify(obj);

  let hash = 0;

  for (let i = 0, len = str.length; i < len; i++) {
    let chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }

  return `${hash}`;
}

export const parseW3CUser = (user?: any) => user
  ? typeof user === 'object' ? { ...user } : user : undefined;

/**
 * Helper to crosswalk the W3C annotation body to a list of core AnnotationBody objects.
 */
export const parseW3CBodies = (
  body: W3CAnnotationBody | W3CAnnotationBody[],
  annotationId: string
) : AnnotationBody[] => (Array.isArray(body) ? body : [body]).map(body => {

  // Exctract properties that conform to the internal model, but keep custom props
  const { id, type, purpose, value, created, creator, ...rest } = body;

  // The internal model strictly requires IDs. (Because multi-user scenarios
  // will have problems without them.) In the W3C model, bodys *may* have IDs.
  // We'll create ad-hoc IDs for bodies without IDs, but want to make sure that
  // generating the ID is idempotent: the same body should always get the same ID.
  // This will avoid unexpected results when checking for equality.  
  return {
    id: id || `temp-${hashCode(body)}`,
    annotation: annotationId,
    type,
    purpose,
    value,
    created: created ? new Date(created) : undefined,
    creator: parseW3CUser(creator),
    ...rest
  }

});

/** Serialization helper to remove core-specific fields from the annotation body **/
export const serializeW3CBodies = (bodies: AnnotationBody[]): W3CAnnotationBody[] =>
  bodies.map(b => {
    const w3c = { ...b } as any;
    delete w3c.annotation;

    if (w3c.id?.startsWith('temp-'))
      delete w3c.id;

    return { ...w3c, created: w3c.created?.toISOString() };
  });
