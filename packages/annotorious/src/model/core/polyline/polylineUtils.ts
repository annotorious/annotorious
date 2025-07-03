import { ShapeType } from '../Shape';
import { distance, registerShapeUtil, type ShapeUtil } from '../shapeUtils';
import { type Polyline, PolylineSegmentType } from './Polyline';

const PolylineUtil: ShapeUtil<Polyline> = {

  area: (_: Polyline): number => {
    // TODO closed polylines!
    return 0;
  },

  intersects: (polyline: Polyline, x: number, y: number, buffer: number = 2): boolean => {
    const { startPoint, segments } = polyline.geometry;
    
    let currentPoint = startPoint;
    
    for (const segment of segments) {
      if (segment.type === PolylineSegmentType.LINE) {
        if (intersectsLineSegment(currentPoint, segment.endPoint, x, y, buffer))
          return true;
      } else if (segment.type === PolylineSegmentType.CURVE && segment.controlPoint1 && segment.controlPoint2) {
        if (intersectsCubicBezier(currentPoint, segment.controlPoint1, segment.controlPoint2, segment.endPoint, x, y, buffer))
          return true;
      }
      currentPoint = segment.endPoint;
    }
    
    return false;
  }
  
};

// See https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line#Line_defined_by_two_points
const intersectsLineSegment = (
  start: [number, number], 
  end: [number, number], 
  x: number, 
  y: number, 
  buffer: number
): boolean => {
  const [[x1, y1], [x2, y2]] = [start, end];
  
  // Twice the area of the triangle formed by connecting the three points
  const area = Math.abs(((y2 - y1) * x) - ((x2 - x1) * y) + (x2 * y1) - (y2 * x1));
  
  const length = distance([x1, y1], [x2, y2]);
  if (length === 0)
    return distance([x, y], [x1, y1]) <= buffer;

  // Check if the point is within the segment bounds (not just the infinite line)
  const distanceToLine = area / length;
  if (distanceToLine <= buffer) {
    // Dot product computes the projection onto the line segment. Dividing by length^2
    // normalizes on the length–0 means the point is at the start, 1 at the end.
    const dot = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / (length * length);
    return dot >= 0 && dot <= 1;
  }
  
  return false;
}

const intersectsCubicBezier = (
  start: [number, number],
  cp1: [number, number],
  cp2: [number, number],
  end: [number, number],
  x: number,
  y: number,
  buffer: number,
  samples = 10 // Sample the curve and check each segment
): boolean => {

  // Calculate a point on a cubic Bezier curve at parameter t (0-1)
  const getCubicBezierPoint = (
    start: [number, number],
    cp1: [number, number],
    cp2: [number, number],
    end: [number, number],
    t: number
  ): [number, number] => {
    const [x0, y0] = start;
    const [x1, y1] = cp1;
    const [x2, y2] = cp2;
    const [x3, y3] = end;
    
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;
    
    const x = mt3 * x0 + 3 * mt2 * t * x1 + 3 * mt * t2 * x2 + t3 * x3;
    const y = mt3 * y0 + 3 * mt2 * t * y1 + 3 * mt * t2 * y2 + t3 * y3;
    
    return [x, y];
  };

  let prevPoint = start;
  
  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    const currentPoint = getCubicBezierPoint(start, cp1, cp2, end, t);
    
    if (intersectsLineSegment(prevPoint, currentPoint, x, y, buffer))
      return true;
    
    prevPoint = currentPoint;
  }
  
  return false;
};

export const getPolylinePoints = (polyline: Polyline): [number, number][] => {
  const points: [number, number][] = [polyline.geometry.startPoint];
  
  for (const segment of polyline.geometry.segments) {
    points.push(segment.endPoint);
    
    // Include control points for more accurate bounds
    if (segment.controlPoint1) {
      points.push(segment.controlPoint1);
    }
    if (segment.controlPoint2) {
      points.push(segment.controlPoint2);
    }
  }
  
  return points;
}

registerShapeUtil(ShapeType.POLYLINE, PolylineUtil);