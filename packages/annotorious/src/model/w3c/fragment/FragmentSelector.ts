import type { Rectangle, RectangleGeometry } from '../../core';
import { ShapeType } from '../../core';

export interface FragmentSelector {

  type: 'FragmentSelector';

  conformsTo: 'http://www.w3.org/TR/media-frags/',

  value: string;

}

const NUMBER = '-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?';

// Anchored, numeric-only pattern. Avoids the broad lazy + nested quantifier
// shapes that allowed pathological backtracking on adversarial input.
const XYWH_RE = new RegExp(
  `^xywh=(?:(pixel|percent):)?(${NUMBER}),(${NUMBER}),(${NUMBER}),(${NUMBER})$`,
  'i'
);

// Strip everything up to and including the first '#xywh=' for URI-style inputs
// like "https://example.org/image.jpg#xywh=...". Returns the bare fragment when
// no hash is present.
const stripHash = (s: string): string => {
  const idx = s.indexOf('#xywh=');
  return idx < 0 ? s : s.slice(idx + 1);
}

export const isFragmentSelector = (
  selector: any
): boolean => {
  if (selector?.type === 'FragmentSelector')
    return true;

  if (typeof selector === 'string') {
    if (selector.indexOf('#xywh=') < 0) return false;
    return XYWH_RE.test(stripHash(selector));
  }

  return false;
}

export const parseFragmentSelector = (
  fragmentOrSelector: FragmentSelector | string,
  invertY = false
): Rectangle => {
  const raw =
    typeof fragmentOrSelector === 'string' ? fragmentOrSelector : fragmentOrSelector.value;

  const fragment = stripHash(raw);

  const matches = XYWH_RE.exec(fragment);

  if (!matches) throw new Error('Not a MediaFragment: ' + raw);

  const [, unit, a, b, c, d] = matches;

  if (unit && unit !== 'pixel') throw new Error(`Unsupported MediaFragment unit: ${unit}`);

  const [x, y, w, h] = [a, b, c, d].map(Number);

  return {
    type: ShapeType.RECTANGLE,
    geometry: {
      x,
      y,
      w,
      h,
      rot: 0,
      bounds: {
        minX: x,
        minY: invertY ? y - h : y,
        maxX: x + w,
        maxY: invertY ? y : y + h
      }
    }
  }
}

export const serializeFragmentSelector = (geometry: RectangleGeometry): FragmentSelector => {
  const { x, y, w, h } = geometry;
  
  return {
    type: 'FragmentSelector',
    conformsTo: 'http://www.w3.org/TR/media-frags/',
    value: `xywh=pixel:${x},${y},${w},${h}`
  };
}
