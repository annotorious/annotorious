import { ShapeType } from '../Shape';
import { computePolygonArea, isPointInPolygon, registerShapeUtil, type ShapeUtil } from '../shapeUtils';
import type { Polyline, PolylineGeometry } from './Polyline';

const PolylineUtil: ShapeUtil<Polyline> = {

  area: (polyline: Polyline): number => {
    const geom = polyline.geometry;
    
    if (!geom.closed || geom.points.length < 3)
      return 0;

    const points = approximateAsPolygon(geom);
    return computePolygonArea(points);
  },

  intersects: (polyline: Polyline, x: number, y: number, buffer: number = 2): boolean => {
    const geom = polyline.geometry;
    
    if (geom.closed) {
      const points = approximateAsPolygon(geom);
      return isPointInPolygon(points, x, y);
    } else {
      // For open polylines, check distance to path segments with buffer
      return isPointNearPath(geom, [x, y], buffer);
    }
  }
  
};

export const approximateAsPolygon = (geom: PolylineGeometry): [number, number][] => {
  const points: [number, number][] = [];
  
  for (let i = 0; i < geom.points.length; i++) {
    const currentPoint = geom.points[i];
    const nextPoint = geom.points[(i + 1) % geom.points.length];
    
    points.push(currentPoint.point);
    
    // If there's a curve to the next point, approximate it
    if (i < geom.points.length - 1 || geom.closed) {
      const hasCurve = currentPoint.outHandle || nextPoint.inHandle;
      if (hasCurve) {
        const curvePoints = approximateBezierCurve(
          currentPoint.point,
          currentPoint.outHandle || currentPoint.point,
          nextPoint.inHandle || nextPoint.point,
          nextPoint.point,
          10 // number of approximation segments
        );
        points.push(...curvePoints.slice(1)); // Skip first point (already added)
      }
    }
  }
  
  return points;
}

const approximateBezierCurve = (
  p0: [number, number], 
  p1: [number, number], 
  p2: [number, number], 
  p3: [number, number], 
  segments: number = 10
): [number, number][] => {
  const points: [number, number][] = [];
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = Math.pow(1 - t, 3) * p0[0] + 
              3 * Math.pow(1 - t, 2) * t * p1[0] + 
              3 * (1 - t) * Math.pow(t, 2) * p2[0] + 
              Math.pow(t, 3) * p3[0];
    const y = Math.pow(1 - t, 3) * p0[1] + 
              3 * Math.pow(1 - t, 2) * t * p1[1] + 
              3 * (1 - t) * Math.pow(t, 2) * p2[1] + 
              Math.pow(t, 3) * p3[1];
    points.push([x, y]);
  }
  
  return points;
}

const isPointNearPath = (geom: PolylineGeometry, point: [number, number], buffer: number): boolean => {  
  for (let i = 0; i < geom.points.length - 1; i++) {
    const currentPoint = geom.points[i];
    const nextPoint = geom.points[i + 1];
    
    const hasCurve = currentPoint.outHandle || nextPoint.inHandle;
    
    if (hasCurve) {
      // For curves, approximate and check distance to segments
      const curvePoints = approximateBezierCurve(
        currentPoint.point,
        currentPoint.outHandle || currentPoint.point,
        nextPoint.inHandle || nextPoint.point,
        nextPoint.point,
        20 // more segments for better accuracy
      );
      
      for (let j = 0; j < curvePoints.length - 1; j++) {
        const distance = distanceToLineSegment(point, curvePoints[j], curvePoints[j + 1]);
        if (distance <= buffer) return true;
      }
    } else {
      // Straight line segment
      const distance = distanceToLineSegment(point, currentPoint.point, nextPoint.point);
      if (distance <= buffer) return true;
    }
  }
  
  return false;
}

const distanceToLineSegment = (
  point: [number, number], 
  lineStart: [number, number], 
  lineEnd: [number, number]
): number => {
  const [px, py] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length === 0) {
    // Line segment is a point
    return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
  }
  
  // Calculate the projection parameter t to see where the perpendicular falls
  const t = ((px - x1) * dx + (py - y1) * dy) / (length * length);
  
  if (t <= 0) {
    // Closest point is the start of the segment
    return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
  } else if (t >= 1) {
    // Closest point is the end of the segment
    return Math.sqrt((px - x2) * (px - x2) + (py - y2) * (py - y2));
  } else {
    // Closest point is on the segment - use the exact line distance formula
    // This is the same formula as your LineUtil.intersects
    const area = Math.abs(((y2 - y1) * px) - ((x2 - x1) * py) + (x2 * y1) - (y2 * x1));
    return area / length;
  }
};

export const computeSVGPath = (geom: PolylineGeometry) => {
  if (!geom.points || geom.points.length === 0)
    return '';

  const pathCommands: string[] = [];

  const firstPoint = geom.points[0];
  pathCommands.push(`M ${firstPoint.point[0]} ${firstPoint.point[1]}`);

  for (let i = 1; i < geom.points.length; i++) {
    const currentPoint = geom.points[i];
    const previousPoint = geom.points[i - 1];
    
    const hasCurve = previousPoint.outHandle || currentPoint.inHandle;
    if (hasCurve) {
      // Cubic Bézier curve
      const cp1 = previousPoint.outHandle || previousPoint.point;
      const cp2 = currentPoint.inHandle || currentPoint.point;
      const endPoint = currentPoint.point;
      
      pathCommands.push(`C ${cp1[0]} ${cp1[1]} ${cp2[0]} ${cp2[1]} ${endPoint[0]} ${endPoint[1]}`);
    } else {
      // Straight line
      pathCommands.push(`L ${currentPoint.point[0]} ${currentPoint.point[1]}`);
    }
  }

  if (geom.closed) {
    // Handle curve from last point back to first point
    const lastPoint = geom.points[geom.points.length - 1];
    const firstPointRef = geom.points[0];
    
    const hasClosingCurve = lastPoint.outHandle || firstPointRef.inHandle;
    
    if (hasClosingCurve) {
      const cp1 = lastPoint.outHandle || lastPoint.point;
      const cp2 = firstPointRef.inHandle || firstPointRef.point;
      const endPoint = firstPointRef.point;
      
      pathCommands.push(`C ${cp1[0]} ${cp1[1]} ${cp2[0]} ${cp2[1]} ${endPoint[0]} ${endPoint[1]}`);
    }
    
    pathCommands.push('Z');
  }
  
  return pathCommands.join(' ');
}

registerShapeUtil(ShapeType.POLYLINE, PolylineUtil);