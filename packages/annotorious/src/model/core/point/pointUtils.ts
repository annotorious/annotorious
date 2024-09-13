import { ShapeType } from "../Shape";
import { registerShapeUtil, type ShapeUtil } from "../shapeUtils";
import { POINT_RADIUS, type Point } from "./Point";

const PointUtil: ShapeUtil<Point> = {

  // Calculate the area of a point (as circle)
  area: (): number => {

    return Math.PI * Math.pow(POINT_RADIUS, 2);
  },

  // Check if coordinates intersect with a point
  intersects: (point: Point, x: number, y: number): boolean => {
    const { geometry } = point;
    const { x: px, y: py } = geometry;

    return Math.sqrt(Math.pow(x - px, 2) + Math.pow(y - py, 2)) <= POINT_RADIUS;
  }

};

registerShapeUtil(ShapeType.POINT, PointUtil);