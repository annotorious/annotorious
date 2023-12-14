import { v4 as uuidv4 } from 'uuid';
import type { FormatAdapter, ParseResult, W3CAnnotation } from '@annotorious/core';
import {
  parseLifecycleInfo,
  parseW3CBodies,
  parseW3CTarget,
  serializeW3CBodies,
  serializeW3CTarget
} from '@annotorious/core';
import type { ImageAnnotation, RectangleGeometry } from '../core';
import { type ImageAnnotationTarget, ShapeType } from '../core';
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

  const w3cTarget = Array.isArray(annotation.target) ? annotation.target[0] : annotation.target;
  const w3cSelector = Array.isArray(w3cTarget.selector) ? w3cTarget.selector[0] : w3cTarget.selector;

  const selector =
    w3cSelector.type === 'FragmentSelector' ?
      parseFragmentSelector(w3cSelector as FragmentSelector, invertY) :
      w3cSelector.type === 'SvgSelector' ?
        parseSVGSelector(w3cSelector as SVGSelector) : undefined;

  const target = parseW3CTarget<ImageAnnotationTarget>(w3cTarget, annotationId, parseLifecycleInfo(annotation), selector);

  return selector ? {
    parsed: {
      ...rest,
      id: annotationId,
      bodies,
      target
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

  const w3cSelector =
    shape.type == ShapeType.RECTANGLE ?
      serializeFragmentSelector(shape.geometry as RectangleGeometry) :
      serializeSVGSelector(shape);

  const w3cTarget = serializeW3CTarget(annotation.target, source, w3cSelector)

  return {
    ...serializableRest,
    ...parseLifecycleInfo(target),
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    type: 'Annotation',
    body: serializeW3CBodies(bodies),
    target: w3cTarget
  };
};
