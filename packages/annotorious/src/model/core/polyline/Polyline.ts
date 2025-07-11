import type { Bounds, Geometry, Shape } from '../Shape';

export interface Polyline extends Shape {

  geometry: PolylineGeometry;

}

export interface PolylineGeometry extends Geometry {

  points: PolylinePoint[];

  closed?: boolean;

  bounds: Bounds;

}

export interface PolylinePoint {

  type: 'CORNER' | 'CURVE';

  point: [number, number];

  inHandle?: [number, number];

  outHandle?: [number, number];

  unlocked?: boolean;

}