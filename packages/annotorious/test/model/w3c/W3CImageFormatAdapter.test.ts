import { describe, it, expect } from 'vitest';
import { W3CAnnotation } from '@annotorious/core';
import { 
  parseW3CImageAnnotation, 
  type Polyline, 
  type RectangleGeometry, 
  serializeW3CImageAnnotation, 
  ShapeType, 
  type W3CImageAnnotation, 
  type W3CImageAnnotationTarget, 
  type W3CImageSelector 
} from '../../../src/model';

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
      rectangleFragment,
      line,
      openCurve,
      closedCurve
    ] = parsed;

    expect(polygon.parsed?.target.selector.type).toBe(ShapeType.POLYGON);
    expect(ellipse.parsed?.target.selector.type).toBe(ShapeType.ELLIPSE);
    expect(closedPath.parsed?.target.selector.type).toBe(ShapeType.POLYGON);
    expect(multiPolygon.parsed?.target.selector.type).toBe(ShapeType.MULTIPOLYGON);
    expect(rectangle.parsed?.target.selector.type).toBe(ShapeType.RECTANGLE);
    expect(rectangleFragment.parsed?.target.selector.type).toBe(ShapeType.RECTANGLE);
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
  });

  it('should serialize axis-aligned rectangles as FragmentSelector', () => {
    const annotation = {
      id: 'test-rect',
      bodies: [],
      target: {
        annotation: 'test-rect',
        selector: {
          type: ShapeType.RECTANGLE,
          geometry: {
            x: 10,
            y: 20,
            w: 100,
            h: 50,
            rot: 0,
            bounds: { minX: 10, minY: 20, maxX: 110, maxY: 70 }
          } as RectangleGeometry
        }
      }
    };

    const serialized = serializeW3CImageAnnotation(annotation, 'http://example.com/image');
    const selector = (serialized.target as W3CImageAnnotationTarget).selector as W3CImageSelector;

    expect(selector.type).toBe('FragmentSelector');
    expect(selector.value).toBe('xywh=pixel:10,20,100,50');
  });

  it('should serialize rotated rectangles as SvgSelector', () => {
    const annotation = {
      id: 'test-rotated-rect',
      bodies: [],
      target: {
        annotation: 'test-rotated-rect',
        selector: {
          type: ShapeType.RECTANGLE,
          geometry: {
            x: 10,
            y: 20,
            w: 100,
            h: 50,
            rot: Math.PI / 4, // 45 degrees
            bounds: { minX: 10, minY: 20, maxX: 110, maxY: 70 }
          }
        }
      }
    };

    const serialized = serializeW3CImageAnnotation(annotation, 'http://example.com/image');
    const selector = (serialized.target as W3CImageAnnotationTarget).selector as W3CImageSelector;

    expect(selector.type).toBe('SvgSelector');
    expect(selector.value).toContain('<rect x="10" y="20" width="100" height="50" transform="rotate(45 60 45)"');
  });
});

