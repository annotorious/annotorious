import { v4 as uuidv4 } from 'uuid';
import { parseW3CUser, parseW3CBodies, serializeW3CBodies, hashCode } from '@annotorious/core';
import type { FormatAdapter, ParseResult, W3CAnnotation } from '@annotorious/core';
import { ShapeType } from '../core';
import type { ImageAnnotation, RectangleGeometry } from '../core';
import type { FragmentSelector } from './fragment';
import { parseFragmentSelector, serializeFragmentSelector } from './fragment';
import type { SVGSelector } from './svg';
import { parseSVGSelector, serializeSVGSelector } from './svg';
import type { W3CImageAnnotation } from './W3CImageAnnotation';

export type W3CImageFormatAdapter = FormatAdapter<ImageAnnotation, W3CImageAnnotation>;

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

const parseW3CImageTargets = (
  annotation: W3CAnnotation,
  invertY = false
) => {
  const {
    id: annotationId,
    creator,
    created,
    modified,
    target
  } = annotation;

  const w3cTarget = Array.isArray(target) ? target[0] : target;

  const w3cSelector = Array.isArray(w3cTarget.selector)
    ? w3cTarget.selector[0] : w3cTarget.selector;

  const selector =
    w3cSelector?.type === 'FragmentSelector' ?
      parseFragmentSelector(w3cSelector as FragmentSelector, invertY) :
      w3cSelector?.type === 'SvgSelector' ?
        parseSVGSelector(w3cSelector as SVGSelector) : undefined;

  const { id, ...rest } = w3cTarget;

  return selector ? {
    parsed: [
      {
        ...rest,
        id: id || `temp-${hashCode(w3cTarget)}`,
        annotation: annotationId,
        created: created ? new Date(created) : undefined,
        creator: parseW3CUser(creator),
        updated: modified ? new Date(modified) : undefined,
        selector,
      }
    ]
  } : {
    error: Error(`Invalid selector: ${JSON.stringify(w3cSelector)}`)
  };
}

export const parseW3CImageAnnotation = (
  annotation: W3CAnnotation, 
  invertY = false
): ParseResult<ImageAnnotation> => {
  const annotationId = annotation.id || uuidv4();

  const { 
    creator,
    created,
    modified,
    body,
    target,
    ...rest 
  } = annotation;

  const bodies = parseW3CBodies(body, annotationId);
  const targets = parseW3CImageTargets(annotation, invertY);

  return 'error' in targets ? { error: targets.error } : {
    parsed: {
      ...rest,
      id: annotationId,
      bodies,
      targets: targets.parsed
    }
  };

}

export const serializeW3CImageAnnotation = (
  annotation: ImageAnnotation, 
  source: string
): W3CImageAnnotation => {
  const { 
    selector, 
    creator, 
    created, 
    updated,
    updatedBy,// Excluded from serialization
    ...rest
  } = annotation.targets[0];

  const w3CSelector =
    selector.type == ShapeType.RECTANGLE ?
      serializeFragmentSelector(selector.geometry as RectangleGeometry) :
      serializeSVGSelector(selector);

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
      selector: w3CSelector
    }
  } as W3CImageAnnotation;

  // Remove core properties that should not appear in the W3C annotation
  delete serialized.bodies;
  delete serialized.targets;

  if ('annotation' in serialized.target)
    delete serialized.target.annotation;

  return serialized;
}
