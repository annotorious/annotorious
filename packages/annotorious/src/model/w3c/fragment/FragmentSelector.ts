import type { Rectangle, RectangleGeometry } from '../../core';
import { ShapeType } from '../../core';

export interface FragmentSelector {

  type: 'FragmentSelector';

  conformsTo: 'http://www.w3.org/TR/media-frags/',

  value: string;

}

export const parseFragmentSelector = (
  fragmentOrSelector: FragmentSelector | string,
  invertY = false
): Rectangle => {

  const fragment =
    typeof fragmentOrSelector === 'string' ? fragmentOrSelector : fragmentOrSelector.value;

  const regex = /^(xywh)=(pixel|percent)?:?(.+?),(.+?),(.+?),(.+)*/g;

  const matches = [...fragment.matchAll(regex)][0];
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
