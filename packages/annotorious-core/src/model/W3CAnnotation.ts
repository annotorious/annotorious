import { v4 as uuidv4 } from 'uuid';
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

/**
 * Helper to crosswalk the W3C annotation body to a list of core AnnotationBody objects.
 */
export const parseW3CBodies = (
  body: W3CAnnotationBody | W3CAnnotationBody[], 
  annotationId: string
): AnnotationBody[] => (Array.isArray(body) ? body : [body]).map(b => ({
  id: b.id || uuidv4(),
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

