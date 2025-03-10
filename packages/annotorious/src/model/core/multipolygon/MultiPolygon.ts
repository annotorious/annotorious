import type { Bounds, Geometry, Shape } from '../Shape';

export interface MultiPolygon extends Shape {

  geometry: MultiPolygonGeometry;

}

export interface MultiPolygonGeometry extends Geometry {

  // Each polygon is an array of rings–outer boundardy + holes
  polygons: Array<MultiPolygonElement>

  bounds: Bounds;
  
}

export interface MultiPolygonElement {

  rings: Array<MultiPolygonRing>;

  bounds: Bounds;

}

export interface MultiPolygonRing {

  points: Array<[number, number]>;

}