import type { Bounds, Geometry, Shape } from '../Shape';

export interface Polyline extends Shape {

  geometry: PolylineGeometry;

}

export interface PolylineGeometry extends Geometry {

  startPoint: [number, number];

  segments: PolylineSegment[];

  closed?: boolean;

  bounds: Bounds;

}

export interface PolylineSegment {

  type: PolylineSegmentType;

  endPoint: [number, number];

  controlPoint1?: [number, number];

  controlPoint2?: [number, number];

}

export enum PolylineSegmentType {
  
  LINE = 'line',
  
  CURVE = 'curve'

}


