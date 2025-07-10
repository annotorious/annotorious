import { describe, it, expect } from 'vitest';
import { W3CAnnotation } from '@annotorious/core';
import { parseW3CImageAnnotation, Polyline, serializeW3CImageAnnotation, ShapeType } from '../../../src/model';

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

    const parsedClosedCurve = closedCurve.parsed?.target?.selector as Polyline | undefined;
    expect(parsedClosedCurve?.type).toBe(ShapeType.POLYLINE);
    expect(parsedClosedCurve?.geometry.closed).toBeTruthy();
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

