import { ShapeType } from '../Shape';
import type { ShapeUtil } from '../shapeUtils';
import { computePolygonArea, isPointInPolygon, registerShapeUtil } from '../shapeUtils';
import type { Polygon } from './Polygon';

const PolygonUtil: ShapeUtil<Polygon> = {

  area: (polygon: Polygon): number => {
    const points = polygon.geometry.points as [number, number][];
    return computePolygonArea(points);
  },

  intersects: (polygon: Polygon, x: number, y: number): boolean => {
    const points = polygon.geometry.points as [number, number][];
    return isPointInPolygon(points, x, y);
  }
  
};

registerShapeUtil(ShapeType.POLYGON, PolygonUtil);