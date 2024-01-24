import { describe, it, expect } from 'vitest';
import { ShapeType } from '../../../src/model';
import { parseW3CImageAnnotation, serializeW3CImageAnnotation} from '../../../src/model';

import { annotations } from './fixtures';

describe('parseW3CImageAnnotation', () => {
  it('should parse the sample annotations correctly', () => {
    // @ts-ignore
    const parsed = annotations.map(a => parseW3CImageAnnotation(a));

    expect(parsed[0].error).toBe(undefined);
    expect(parsed[1].error).toBe(undefined);

    const [polygon, ellipse, rectangle] = parsed;

    expect(polygon.parsed?.target.selector.type).toBe(ShapeType.POLYGON);
    expect(ellipse.parsed?.target.selector.type).toBe(ShapeType.ELLIPSE);
    expect(rectangle.parsed?.target.selector.type).toBe(ShapeType.RECTANGLE);
  });
});

describe('serializeW3CImageAnnotation', () => {
  it('should serialize the sample annotations correctly', () => {
    // @ts-ignore
    const parsed = annotations.map(a => parseW3CImageAnnotation(a));

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

