import type { Bounds, Geometry, Shape } from '../Shape';

export interface Line extends Shape {

  geometry: LineGeometry;

}

export interface LineGeometry extends Geometry {

  points: [[number, number], [number, number]]

  bounds: Bounds;
  
}