import { describe, expect, it } from 'vitest';
import { createSVGTransform } from '../../src/annotation/Transform';

describe('createSVGTransform', () => {
  it('scales offset coordinates by the viewBox/client-size ratio', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
    svg.setAttribute('viewBox', '0 0 800 600');
    Object.defineProperty(svg, 'clientWidth', { value: 400, configurable: true });
    Object.defineProperty(svg, 'clientHeight', { value: 300, configurable: true });

    // Scale factor is 2x on both axes here, regardless of any ancestor CSS
    // transform - jsdom doesn't implement getScreenCTM, so this also proves
    // the mapping no longer depends on it.
    expect(createSVGTransform(svg).elementToImage(100, 50)).toEqual([200, 100]);
  });
});
