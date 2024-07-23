import { v4 as uuidv4 } from 'uuid';
import { parseW3CUser, parseW3CBodies, serializeW3CBodies } from '@annotorious/core';
import type { FormatAdapter, ParseResult, W3CAnnotation } from '@annotorious/core';
import { ShapeType } from '../core';
import type { ImageAnnotation, RectangleGeometry } from '../core';
import type {FragmentSelector } from './fragment';
import { parseFragmentSelector, serializeFragmentSelector } from './fragment';
import type { SVGSelector } from './svg';
import { parseSVGSelector, serializeSVGSelector } from './svg';
import type { W3CImageAnnotation } from './W3CImageAnnotation';

export type W3CImageFormatAdapter = FormatAdapter<ImageAnnotation, W3CImageAnnotation>;

export const W3CImageFormat = (
  source: string,
  strict = true,
  invertY = false
): W3CImageFormatAdapter => {

  const parse = (serialized: W3CAnnotation) =>
    parseW3CImageAnnotation(serialized, strict, invertY);

  const serialize = (annotation: ImageAnnotation) =>
    serializeW3CImageAnnotation(annotation, source, strict);

  return { parse, serialize }
}

export const parseW3CImageAnnotation = (
  annotation: W3CAnnotation, 
  strict: boolean,
  invertY: boolean
): ParseResult<ImageAnnotation> => {
  const annotationId = annotation.id || uuidv4();

  const { 
    creator,
    created,
    modified,
    body, 
    ...rest 
  } = annotation;

  const bodies = parseW3CBodies(body || [], annotationId);

  const w3cTarget = Array.isArray(annotation.target) 
    ? annotation.target[0] : annotation.target;

  const w3cSelector = Array.isArray(w3cTarget.selector) 
    ? w3cTarget.selector[0] : w3cTarget.selector;

  const selector = 
    w3cSelector?.type === 'FragmentSelector' ?
      parseFragmentSelector(w3cSelector as FragmentSelector, invertY) :
    w3cSelector?.type === 'SvgSelector' ?
      parseSVGSelector(w3cSelector as SVGSelector) : undefined;

  return (selector || !strict) ? { 
    parsed: {
      ...rest,
      id: annotationId,
      bodies,
      target: {
        created: created ? new Date(created) : undefined,
        creator: parseW3CUser(creator),
        updated: modified ? new Date(modified) : undefined,
        ...(Array.isArray(rest.target) ? rest.target[0] : rest.target),
        annotation: annotationId,
        selector: selector || w3cSelector
      }
    }
  } : {
    error: Error(`Invalid selector: ${JSON.stringify(w3cSelector)}`)
  };
}

export const serializeW3CImageAnnotation = (
  annotation: ImageAnnotation, 
  source: string,
  strict = true
): W3CImageAnnotation => {
  const { 
    selector, 
    creator, 
    created, 
    updated,
    updatedBy, // Excluded from serialization
    ...rest 
  } = annotation.target;

  let w3cSelector: FragmentSelector | SVGSelector | unknown;

  try {
    w3cSelector = selector.type == ShapeType.RECTANGLE ?
      serializeFragmentSelector(selector.geometry as RectangleGeometry) :
      serializeSVGSelector(selector);
  } catch (error) {
    if (strict)
      throw error;
    else 
     w3cSelector = selector;
  }

  const serialized = {
    ...annotation,
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    id: annotation.id,
    type: 'Annotation',
    body: serializeW3CBodies(annotation.bodies),
    created: created?.toISOString(),
    creator,
    modified: updated?.toISOString(),
    target: {
      ...rest,
      source,
      selector: w3cSelector
    }
  } as W3CImageAnnotation;

  // Remove core properties that should not appear in the W3C annotation
  delete serialized.bodies;
  
  if ('annotation' in serialized.target)
    delete serialized.target.annotation;

  return serialized;
}
