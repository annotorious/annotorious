import { ShapeType } from '../Shape';
import type { ShapeUtil } from '../shapeUtils';
import { boundsFromPoints, computePolygonArea, isPointInPolygon, registerShapeUtil, simplifyPoints } from '../shapeUtils';
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

export const simplifyPolygon = (polygon: Polygon, tolerance = 1): Polygon => {
  const points = simplifyPoints(polygon.geometry.points, tolerance);
  const bounds = boundsFromPoints(points);

  return {
    ...polygon,
    geometry: {
      ...polygon.geometry,
      bounds,
      points
    }
  }
}

registerShapeUtil(ShapeType.POLYGON, PolygonUtil);