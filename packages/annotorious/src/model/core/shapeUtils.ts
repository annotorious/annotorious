import simplify from 'simplify-js';
import type { Bounds, Shape, ShapeType } from './Shape';

export interface ShapeUtil<T extends Shape> {

  area: (shape: T) => number;

  intersects: (shape: T, x: number, y: number, buffer?: number) => boolean;

}

const Utils: { [key: string]: ShapeUtil<any> } = {};

/**
 * Registers a new ShapeUtil for a given shape type.
 * @param type the shape type
 * @param util the ShapeUtil implementation for this shape type
 */
export const registerShapeUtil = (type: ShapeType | string, util: ShapeUtil<any>) =>
  (Utils[type] = util);

/**
 * Computes the area of the given shape. Delegates to the corresponding ShapeUtil.
 * @param shape the shape
 */
export const computeArea = (shape: Shape) => Utils[shape.type].area(shape);

/**
 * Tests if the given shape intersects the given point. Delegates to
 * the corresponding ShapeUtil.
 * @param shape the shape
 * @param x point x coord
 * @param y point y coord
 * @param buffer optional buffer around the point to consider as intersection
 * @returns true if shape and point intersect
 */
export const intersects = (shape: Shape, x: number, y: number, buffer?: number): boolean =>
  Utils[shape.type].intersects(shape, x, y, buffer);

/**
 * Computes Bounds from a given list of points.
 * @param points the points
 * @returns the Bounds
 */
export const boundsFromPoints = (points: Array<[number, number]>): Bounds => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  points.forEach(([x, y]) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });

  return { minX, minY, maxX, maxY };
}

export const computePolygonArea = (points: [number, number][]) => {
  let area = 0;
  let j = points.length - 1;

  for (let i = 0; i < points.length; i++) {
    area += (points[j][0] + points[i][0]) * (points[j][1] - points[i][1]);
    j = i;
  }

  return Math.abs(0.5 * area);
}

export const isPointInPolygon = (points: [number, number][], x: number, y: number): boolean => {
  // Based on https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html
  let inside = false;

  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i][0],
      yi = points[i][1];
    const xj = points[j][0],
      yj = points[j][1];

    const intersect = yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

export const pointsToPath = (points: [number, number][], close: boolean = true): string => {
  let d = 'M ';

  points.forEach(([x, y], idx) => {
    if (idx === 0) {
      // First point after the M command
      d += `${x},${y}`;
    } else {
      d += ` L ${x},${y}`;
    }
  });

  if (close)
    d += ' Z';

  return d;
}

export const simplifyPoints = (points: number[][], tolerance = 1): [number, number][] => {
  const mapped = points.map(([x, y]) => ({ x, y }));
  return simplify(mapped, tolerance, true).map(pt => [pt.x, pt.y]);
}

export const distance = (a: [number, number], b: [number, number]): number => {
  const dx = Math.abs(b[0] - a[0]);
  const dy = Math.abs(b[1] - a[1]);

  return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
}