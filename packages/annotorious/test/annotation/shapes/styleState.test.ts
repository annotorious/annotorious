import { describe, it, expect, vi } from 'vitest';
import Rectangle from '../../../src/annotation/shapes/Rectangle.svelte';
import type { ImageAnnotation } from '../../../src/model';

/**
 * Regression test for https://github.com/annotorious/annotorious/issues/562
 *
 * The plain SVG renderer must forward the annotation `state` (selected / hovered)
 * to a style function, the same way the OpenSeadragon renderer does.
 */
describe('shape style function receives annotation state', () => {

  const annotation = {
    id: 'annotation-1',
    bodies: [],
    target: { selector: { geometry: { x: 0, y: 0, w: 10, h: 10 } } }
  } as unknown as ImageAnnotation;

  const geom = { x: 0, y: 0, w: 10, h: 10 };

  it('passes the state object as the second argument', () => {
    const style = vi.fn(() => ({ fill: '#ff0000' as const }));
    const state = { selected: true, hovered: false };

    const component = new Rectangle({
      target: document.createElement('div'),
      props: { annotation, geom, style, state }
    });

    expect(style).toHaveBeenCalledWith(annotation, state);

    component.$destroy();
  });

  it('passes undefined when no state is provided (default prop)', () => {
    const style = vi.fn(() => ({ fill: '#ff0000' as const }));

    const component = new Rectangle({
      target: document.createElement('div'),
      props: { annotation, geom, style }
    });

    expect(style).toHaveBeenCalledWith(annotation, undefined);

    component.$destroy();
  });
});
