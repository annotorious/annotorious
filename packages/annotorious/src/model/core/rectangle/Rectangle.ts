import type { Bounds, Geometry, Shape } from '../Shape';

export interface Rectangle extends Shape {

  geometry: RectangleGeometry;
  
}

export interface RectangleGeometry extends Geometry {

  x: number;

  y: number;

  w: number;

  h: number;

  bounds: Bounds;

}