import { describe, it, expect } from 'vitest';
import { parseFragmentSelector } from '../../../../src/model/w3c/fragment';

describe('parseFragmentSelector', () => {
  it('should parse a fragment with pixel unit correctly', () => {
    const fragment = 'xywh=pixel:160,120,320,240';
    const { geometry: { x, y, w, h, bounds } } = parseFragmentSelector(fragment);

    expect(x).toBe(160);
    expect(y).toBe(120);
    expect(w).toBe(320);
    expect(h).toBe(240);

    expect(bounds.minX).toBe(160);
    expect(bounds.minY).toBe(120);
    expect(bounds.maxX).toBe(480);
    expect(bounds.maxY).toBe(360);
  });

  it('should parse a fragment without unit as pixel fragment', () => {
    const fragment = 'xywh=160,120,320,240';
    const { geometry: { x, y, w, h, bounds } } = parseFragmentSelector(fragment);

    expect(x).toBe(160);
    expect(y).toBe(120);
    expect(w).toBe(320);
    expect(h).toBe(240);

    expect(bounds.minX).toBe(160);
    expect(bounds.minY).toBe(120);
    expect(bounds.maxX).toBe(480);
    expect(bounds.maxY).toBe(360);
  });

  it('should fail for a fragment with percent unit', () => {
    const fragment = 'xywh=percent:25,25,50,50';

    try {
      parseFragmentSelector(fragment);
    } catch (error) {
      expect((error as Error).message).toBe('Unsupported MediaFragment unit: percent');
    }
  });

  it('should fail for a canvas-level annotation without fragment', () => {
    const target = 'https://www.example.com/iiif/image1/canvas/p1';

    try {
      parseFragmentSelector(target);
    } catch (error) {
      expect((error as Error).message.startsWith('Not a MediaFragment')).toBeTruthy();
    }
  })
});
