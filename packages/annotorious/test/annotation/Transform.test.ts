import { describe, expect, it } from 'vitest';
import { createSVGTransform } from '../../src/annotation/Transform';

describe('createSVGTransform', () => {
  it('scales offset coordinates by the viewBox/client-size ratio, not by bounding-box or CTM geometry', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
    svg.setAttribute('viewBox', '0 0 800 600');

    // jsdom has no layout engine, so a real CSS transform wouldn't change
    // clientWidth/clientHeight - these stand in for what a 2x-scaled ancestor
    // would produce, which getBoundingClientRect/getScreenCTM get wrong.
    Object.defineProperty(svg, 'clientWidth', { value: 400, configurable: true });
    Object.defineProperty(svg, 'clientHeight', { value: 300, configurable: true });

    expect(createSVGTransform(svg).elementToImage(100, 50)).toEqual([200, 100]);
  });
});
