import { ShapeType } from '../Shape';
import { distance, registerShapeUtil, type ShapeUtil } from '../shapeUtils';
import type { Line } from './Line';

const LineUtil: ShapeUtil<Line> = {

  area: (_: Line): number => 0,

  intersects: (l: Line, x: number, y: number, buffer: number = 2): boolean => {
    // See https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line#Line_defined_by_two_points
    const [[x1, y1], [x2, y2]] = l.geometry.points;
    
    // Twice the area of the triangle formed by connecting the three points
    const area = Math.abs(((y2 - y1) * x) - ((x2 - x1) * y) + (x2 * y1) - (y2 * x1));
  
    const length = distance([x1, y1], [x2, y2]);

    return area / length <= buffer;
  }
  
};

registerShapeUtil(ShapeType.LINE, LineUtil);