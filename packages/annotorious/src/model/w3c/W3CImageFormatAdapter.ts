import { v4 as uuidv4 } from 'uuid';
import { parseW3CUser, parseW3CBodies, serializeW3CBodies } from '@annotorious/core';
import type { FormatAdapter, ParseResult, W3CAnnotation } from '@annotorious/core';
import { ShapeType } from '../core';
import type { ImageAnnotation, RectangleGeometry } from '../core';
import type { FragmentSelector } from './fragment';
import { parseFragmentSelector, serializeFragmentSelector } from './fragment';
import type { SVGSelector } from './svg';
import { parseSVGSelector, serializeSVGSelector } from './svg';

export type W3CImageFormatAdapter = FormatAdapter<ImageAnnotation, W3CAnnotation>;

export const W3CImageFormat = (
  source: string,
  invertY: boolean = false
): W3CImageFormatAdapter => {

  const parse = (serialized: W3CAnnotation) =>
    parseW3CImageAnnotation(serialized, invertY);

  const serialize = (annotation: ImageAnnotation) =>
    serializeW3CImageAnnotation(annotation, source);

  return { parse, serialize }
}

export const parseW3CImageAnnotation = (
  annotation: W3CAnnotation, 
  invertY: boolean = false
): ParseResult<ImageAnnotation> => {
  const annotationId = annotation.id || uuidv4();

  const { 
    creator,
    created,
    modified,
    body, 
    ...rest 
  } = annotation;

  const bodies = parseW3CBodies(body, annotationId);

  const target = Array.isArray(annotation.target) ? annotation.target[0] : annotation.target;

  const w3cSelector = Array.isArray(target.selector) ? target.selector[0] : target.selector;

  const selector = 
    w3cSelector.type === 'FragmentSelector' ?
      parseFragmentSelector(w3cSelector as FragmentSelector, invertY) :
    w3cSelector.type === 'SvgSelector' ?
      parseSVGSelector(w3cSelector as SVGSelector) : undefined;

  return selector ? { 
    parsed: {
      ...rest,
      id: annotationId,
      bodies,
      target: {
        created: created ? new Date(created) : undefined,
        creator: parseW3CUser(creator),
        updated: modified ? new Date(modified) : undefined,
        ...rest.target,
        annotation: annotationId,
        selector
      }
    }
  } : {
    error: Error(`Unknown selector type: ${w3cSelector.type}`)
  };

}

export const serializeW3CImageAnnotation = (
  annotation: ImageAnnotation, 
  source: string
): W3CAnnotation => {
  const { 
    selector, 
    creator, 
    created, 
    updated,
    updatedBy: _updatedBy, // Excluded from serialization
    ...rest 
  } = annotation.target;

  const w3CSelector =
    selector.type == ShapeType.RECTANGLE ?
      serializeFragmentSelector(selector.geometry as RectangleGeometry) :
      serializeSVGSelector(selector);

  return {
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
      selector: w3CSelector
    }
  };
};
