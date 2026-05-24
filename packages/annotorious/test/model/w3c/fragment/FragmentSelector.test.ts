import { describe, it, expect } from 'vitest';
import { parseFragmentSelector } from '../../../../src/model/w3c/fragment';

describe('parseFragmentSelector', () => {
  it('should parse a fragment with pixel unit correctly', () => {
    const fragment = 'xywh=pixel:160,120,320,240';
    const { geometry: { x, y, w, h, rot, bounds } } = parseFragmentSelector(fragment);

    expect(x).toBe(160);
    expect(y).toBe(120);
    expect(w).toBe(320);
    expect(h).toBe(240);
    expect(rot).toBe(0);

    expect(bounds.minX).toBe(160);
    expect(bounds.minY).toBe(120);
    expect(bounds.maxX).toBe(480);
    expect(bounds.maxY).toBe(360);
  });

  it('should parse a fragment without unit as pixel fragment', () => {
    const fragment = 'xywh=160,120,320,240';
    const { geometry: { x, y, w, h, rot, bounds } } = parseFragmentSelector(fragment);

    expect(x).toBe(160);
    expect(y).toBe(120);
    expect(w).toBe(320);
    expect(h).toBe(240);
    expect(rot).toBe(0);

    expect(bounds.minX).toBe(160);
    expect(bounds.minY).toBe(120);
    expect(bounds.maxX).toBe(480);
    expect(bounds.maxY).toBe(360);
  });

  it('should parse a fragment with negative values', () => {
    const fragment = 'xywh=160,-120,320,240';
    const { geometry: { x, y, w, h, rot, bounds } } = parseFragmentSelector(fragment);

    expect(x).toBe(160);
    expect(y).toBe(-120);
    expect(w).toBe(320);
    expect(h).toBe(240);
    expect(rot).toBe(0);

    expect(bounds.minX).toBe(160);
    expect(bounds.minY).toBe(-120);
    expect(bounds.maxX).toBe(480);
    expect(bounds.maxY).toBe(120);
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
  });

  it('should reject malformed coordinate values rather than silently truncate them', () => {
    expect(() => parseFragmentSelector('xywh=pixel:10abc,20def,30ghi,40jkl'))
      .toThrow(/Not a MediaFragment/);
  });

  it('should parse adversarial input in bounded time', () => {
    const payload = 'xywh='.repeat(16000) + '\nxywh=1,2,3,4';

    const start = performance.now();
    try {
      parseFragmentSelector(payload);
    } catch {
      // Rejection is the correct outcome; what matters is the bounded time.
    }
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(50);
  });

  it('should parse decimal coordinates', () => {
    const { geometry: { x, y, w, h } } = parseFragmentSelector('xywh=10.5,20.25,30,40');

    expect(x).toBe(10.5);
    expect(y).toBe(20.25);
    expect(w).toBe(30);
    expect(h).toBe(40);
  });

  it('should parse a URI fragment with #xywh=', () => {
    const { geometry: { x, y, w, h } } = parseFragmentSelector('https://example.com/image.jpg#xywh=10,20,30,40');

    expect(x).toBe(10);
    expect(y).toBe(20);
    expect(w).toBe(30);
    expect(h).toBe(40);
  });
});
