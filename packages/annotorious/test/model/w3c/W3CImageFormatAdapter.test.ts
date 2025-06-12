import { describe, it, expect } from 'vitest';
import { W3CAnnotation } from '@annotorious/core';
import { parseW3CImageAnnotation, serializeW3CImageAnnotation, ShapeType } from '../../../src/model';

import { annotations } from './fixtures';

describe('parseW3CImageAnnotation', () => {
  it('should parse the sample annotations correctly', () => {
    const parsed = (annotations as W3CAnnotation[]).map(a => parseW3CImageAnnotation(a));

    expect(parsed.some(r => r.error)).toBeFalsy();
    
    const [polygon, ellipse, path, multi, rectangle, line] = parsed;

    expect(polygon.parsed?.target.selector.type).toBe(ShapeType.POLYGON);
    expect(ellipse.parsed?.target.selector.type).toBe(ShapeType.ELLIPSE);
    expect(path.parsed?.target.selector.type).toBe(ShapeType.POLYGON);
    expect(multi.parsed?.target.selector.type).toBe(ShapeType.MULTIPOLYGLON);
    expect(rectangle.parsed?.target.selector.type).toBe(ShapeType.RECTANGLE);
    expect(line.parsed?.target.selector.type).toBe(ShapeType.LINE);
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

