import type { Bounds, Geometry, Shape } from '../Shape';

export interface Ellipse extends Shape {

  geometry: EllipseGeometry;

}

export interface EllipseGeometry extends Geometry {

  cx: number;

  cy: number;

  rx: number;

  ry: number;

  bounds: Bounds;
  
}