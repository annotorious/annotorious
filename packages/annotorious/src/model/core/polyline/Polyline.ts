import type { Bounds, Geometry, Shape } from '../Shape';

export interface Polyline extends Shape {

  geometry: PolylineGeometry;

}

export interface PolylineGeometry extends Geometry {

  start: [number, number];

  segments: PolylineSegment[];

  closed?: boolean;

  bounds: Bounds;

}

export interface PolylineSegment {

  type: PolylineSegmentType;

  end: [number, number];

  cp1?: [number, number];

  cp2?: [number, number];

}

export enum PolylineSegmentType {
  
  LINE = 'LINE',
  
  CURVE = 'CURVE'

}


