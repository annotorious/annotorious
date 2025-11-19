import { describe, it, expect } from 'vitest';
import { W3CAnnotation } from '@annotorious/core';
import { parseW3CImageAnnotation, Polyline, serializeW3CImageAnnotation, ShapeType, W3CImageAnnotation } from '../../../src/model';

import { annotations } from './fixtures';

describe('parseW3CImageAnnotation', () => {
  it('should parse the sample annotations correctly', () => {
    const parsed = (annotations as W3CAnnotation[]).map(a => parseW3CImageAnnotation(a));

    expect(parsed.some(r => r.error)).toBeFalsy();
    
    const [
      polygon, 
      ellipse, 
      closedPath,
      multiPolygon, 
      rectangle, 
      line,
      openCurve,
      closedCurve
    ] = parsed;

    expect(polygon.parsed?.target.selector.type).toBe(ShapeType.POLYGON);
    expect(ellipse.parsed?.target.selector.type).toBe(ShapeType.ELLIPSE);
    expect(closedPath.parsed?.target.selector.type).toBe(ShapeType.POLYGON);
    expect(multiPolygon.parsed?.target.selector.type).toBe(ShapeType.MULTIPOLYGON);
    expect(rectangle.parsed?.target.selector.type).toBe(ShapeType.RECTANGLE);
    expect(line.parsed?.target.selector.type).toBe(ShapeType.LINE);

    const parsedOpenCurve = openCurve.parsed?.target?.selector as Polyline | undefined;
    expect(parsedOpenCurve?.type).toBe(ShapeType.POLYLINE);
    expect(parsedOpenCurve?.geometry.closed).toBeFalsy();

    // Expect all curve points have locked handles
    const openCurveCorners = parsedOpenCurve?.geometry.points.filter(pt => pt.locked).length;
    expect(openCurveCorners).toBe(3);

    const parsedClosedCurve = closedCurve.parsed?.target?.selector as Polyline | undefined;
    expect(parsedClosedCurve?.type).toBe(ShapeType.POLYLINE);
    expect(parsedClosedCurve?.geometry.closed).toBeTruthy();

    const closedCurveCorners = parsedClosedCurve?.geometry.points.filter(pt => pt.locked).length;
    expect(closedCurveCorners).toBe(3);
  });

  it('should reject parsing a canvas-level annotation', () => {
    const annotation: W3CImageAnnotation = {
      '@context': 'http://www.w3.org/ns/anno.jsonld',
      id: 'http://www.example.com/annotation/cf5c808a-3c36-4dc4-a8bf-b4acbc4b1ec2',
      type: 'Annotation',
      body: {
        type: 'TextualBody',
        value: 'A comment'
      },
      target: 'https://www.example.com/iiif/image1/canvas/p1'
    };

    const { parsed, error } = parseW3CImageAnnotation(annotation);
    expect(parsed).toBeUndefined();
    expect(error).toBeDefined();
    expect(error?.message.startsWith('Invalid selector:')).toBeTruthy();
  });
});

describe('serializeW3CImageAnnotation', () => {
  it('should serialize the sample annotations correctly', () => {
    const parsed = (annotations as W3CAnnotation[]).map(a => parseW3CImageAnnotation(a));

    const core = parsed.map(result => result.parsed!).filter(Boolean);
    expect(core.length).toBe(parsed.length);

    const serialized = core.map(annotation => serializeW3CImageAnnotation(annotation, 'http://www.example.com/source/1'));

    serialized.forEach((a, idx) => {
      const e = annotations[idx];
      expect(a.id).toBe(e.id);
      expect('bodies' in a).toBeFalsy();
    })
  })
});

