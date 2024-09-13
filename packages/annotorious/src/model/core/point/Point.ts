import type { Bounds, Geometry, Shape } from '../Shape';

export interface Point extends Shape {

  geometry: PointGeometry;

}

export interface PointGeometry extends Geometry {

  x: number;

  y: number;

  bounds: Bounds;

}

export const POINT_RADIUS = 5;