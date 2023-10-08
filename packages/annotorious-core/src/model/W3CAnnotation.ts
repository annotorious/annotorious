import type { AnnotationBody } from './Annotation';

export interface W3CAnnotation {

  '@context': 'http://www.w3.org/ns/anno.jsonld';

  type: 'Annotation';

  id: string;

  body: W3CAnnotationBody | W3CAnnotationBody[]

  target: W3CAnnotationTarget | W3CAnnotationTarget[];

  [key: string]: any;

}

export interface W3CAnnotationBody {

  id?: string;

  type?: string;

  purpose?: string;

  value?: string;

  created?: Date;

  creator?: {

    type?: string;

    id: string;

    name?: string;

  };

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

/**
 * Helper to crosswalk the W3C annotation body to a list of core AnnotationBody objects.
 */
export const parseW3CBodies = (
  body: W3CAnnotationBody | W3CAnnotationBody[], 
  annotationId: string
): AnnotationBody[] => (Array.isArray(body) ? body : [body]).map(b => ({
  // We want a simple, fast ID that remains the same for same body content
  id: b.id || hashCode(b),
  annotation: annotationId,
  type: b.type,
  purpose: b.purpose,
  value: b.value,
  created: b.created,
  creator: b.creator ? 
    typeof b.creator === 'object' ? { ...b.creator }: b.creator :
    undefined
}));


export const serializeW3CBodies = (bodies: AnnotationBody[]): W3CAnnotationBody[] => 
  bodies.map(b => {
    const w3c = { ...b };
    delete w3c.annotation;
    delete w3c.id;
    return w3c;
  });

