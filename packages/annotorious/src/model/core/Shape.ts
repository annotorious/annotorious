import type { AbstractSelector } from '@annotorious/core';

export interface Shape extends AbstractSelector {

  type: ShapeType;

  geometry: Geometry;

}

export enum ShapeType {

  ELLIPSE = 'ELLIPSE',

  MULTIPOLYGON = 'MULTIPOLYGON',

  POLYGON = 'POLYGON',

  POLYLINE = 'POLYLINE',

  RECTANGLE = 'RECTANGLE',

  LINE = 'LINE'

}

export interface Geometry {

  bounds: Bounds;

}

export interface Bounds {

  minX: number;

  minY: number;

  maxX: number;

  maxY: number;

}