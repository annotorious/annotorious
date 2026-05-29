import type { Rectangle, RectangleGeometry } from '../../core';
import { ShapeType } from '../../core';

export interface FragmentSelector {

  type: 'FragmentSelector';

  conformsTo: 'http://www.w3.org/TR/media-frags/',

  value: string;

}

const number = '-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?';

const MAX_FRAGMENT_LENGTH = 512; // ReDoS guard

export const isFragmentSelector = (
  selector: any
): boolean => {
  if (selector?.type === 'FragmentSelector')
    return true;

  if (typeof selector === 'string') {
    if (selector.length > MAX_FRAGMENT_LENGTH) return false;

    const hashIndex = selector.indexOf('#');
    if (hashIndex < 0) return false;

    const xywh = new RegExp(
      `#xywh=((?:pixel|percent):)?(${number}),(${number}),(${number}),(${number})$`,
      'i');

    return xywh.test(selector);
  }

  return false;
}

export const parseFragmentSelector = (
  fragmentOrSelector: FragmentSelector | string,
  invertY = false
): Rectangle => {
  const fragment =
    typeof fragmentOrSelector === 'string' ? fragmentOrSelector : fragmentOrSelector.value;

  if (fragment.length > MAX_FRAGMENT_LENGTH) throw new Error('Fragment too long: ' + fragment);

  const regex = new RegExp(
    `(xywh)=((?:pixel|percent))?:?(${number}),(${number}),(${number}),(${number})$`,
  );
  
  const matches = regex.exec(fragment);

  if (!matches) throw new Error('Not a MediaFragment: ' + fragment);

  const [_, prefix, unit, a, b, c, d] = matches;

  if (prefix !== 'xywh') throw new Error('Unsupported MediaFragment: ' + fragment);

  if (unit && unit !== 'pixel') throw new Error(`Unsupported MediaFragment unit: ${unit}`);

  const [x, y, w, h] = [a, b, c, d].map(parseFloat);

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
