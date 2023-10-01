import type { W3CSelector } from '@annotorious/core';
import { boundsFromPoints, ShapeType } from '../../core';
import type { PolygonGeometry, Shape } from '../../core';

export interface SVGSelector extends W3CSelector {

  type: 'SvgSelector';

  value: string;
  
}

export const parseSVGSelector = <T extends Shape>(valueOrSelector: SVGSelector | string): T => {
  const value = typeof valueOrSelector === 'string' ? valueOrSelector : valueOrSelector.value;

  const [a, b, str] = value.match(/(<polygon points=["|'])([^("|')]*)/) || [];

  if (!str) return;

  const points = str.split(' ').map((p) => p.split(',').map(parseFloat));

  const polygon = {
    type: ShapeType.POLYGON,
    geometry: {
      points,
      bounds: boundsFromPoints(points as [number, number][])
    }
  };

  return polygon as unknown as T;
};

export const serializeSVGSelector = (shape: Shape): SVGSelector => {
  let value: string;

  if (shape.type === ShapeType.POLYGON) {
    const geom = shape.geometry as PolygonGeometry;
    const { points } = geom;
    value = `<polygon points="${points.map((xy) => xy.join(',')).join(' ')}" />`;
  }

  if (value) {
    return { type: 'SvgSelector', value };
  } else {
    throw `Unsupported shape type: ${shape.type}`;
  }
};
