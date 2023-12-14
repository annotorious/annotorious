import { v4 as uuidv4 } from 'uuid';
import { extractTargetLifecycleProps, parseW3CBodies, serializeW3CBodies } from '@annotorious/core';
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

  return { parse, serialize };
};

export const parseW3CImageAnnotation = (
  annotation: W3CAnnotation,
  invertY: boolean = false
): ParseResult<ImageAnnotation> => {
  const annotationId = annotation.id || uuidv4();

  const { body, ...rest } = annotation;

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
        annotation: annotationId,
        selector
      }
    }
  } : {
    error: Error(`Unknown selector type: ${w3cSelector.type}`)
  };

};

export const serializeW3CImageAnnotation = (
  annotation: ImageAnnotation,
  source: string
): W3CAnnotation => {
  const { target, bodies, ...serializableRest } = annotation;

  const shape = target.selector;

  const selector =
    shape.type == ShapeType.RECTANGLE ?
      serializeFragmentSelector(shape.geometry as RectangleGeometry) :
      serializeSVGSelector(shape);

  return {
    ...serializableRest,
    ...extractTargetLifecycleProps(target),
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    type: 'Annotation',
    body: serializeW3CBodies(bodies),
    target: {
      source,
      selector
    }
  };
};
