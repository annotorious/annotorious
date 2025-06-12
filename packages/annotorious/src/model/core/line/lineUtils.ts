import { ShapeType } from '../Shape';
import { registerShapeUtil, type ShapeUtil } from '../shapeUtils';
import type { Line } from './Line';
import { distance } from '../../../annotation/utils';

const LineUtil: ShapeUtil<Line> = {

  area: (_: Line): number => 0,

  intersects: (l: Line, x: number, y: number): boolean => {
    const [[x1, y1], [x2, y2]] = l.geometry.points;

    // Maximum distance in pixels at which we consider the point intersects with the line
    const tolerance = 1;

    // Twice the area of the triangle formed by connecting the three points
    const area = Math.abs(((y2 - y1) * x) - ((x2 - x1) * y) + (x2 * y1) - (y2 * x1));
  
    const length = distance([x1, y1], [x2, y2]);
  
    return area / length <= tolerance;
  }
};

registerShapeUtil(ShapeType.LINE, LineUtil);