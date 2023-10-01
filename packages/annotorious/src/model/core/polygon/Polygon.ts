import type { Bounds, Geometry, Shape } from '../Shape';

export interface Polygon extends Shape {

  geometry: PolygonGeometry;

}

export interface PolygonGeometry extends Geometry {

  points: Array<Array<number>>;

  bounds: Bounds;
  
}