import { ShapeType } from '../Shape';
import type { Rectangle } from './Rectangle';
import { registerShapeUtil, type ShapeUtil } from '../shapeUtils';

export const RectangleUtil: ShapeUtil<Rectangle> = {

  area: (rect: Rectangle): number => rect.geometry.w * rect.geometry.h,

  intersects: (rect: Rectangle, x: number, y: number): boolean => {
    const geom = rect.geometry;
    
    if (geom.rot === 0) {
      return x >= geom.x &&
        x <= geom.x + geom.w &&
        y >= geom.y &&
        y <= geom.y + geom.h;
    } else {
      // For rotated rectangles, transform the test point to local coordinates
      const centerX = geom.x + geom.w / 2;
      const centerY = geom.y + geom.h / 2;

      // Translate point relative to center
      const dx = x - centerX;
      const dy = y - centerY;

      // Rotate backwards to get to local (non-rotated) coordinates
      const cos = Math.cos(geom.rot);
      const sin = Math.sin(geom.rot);

      const localX = dx * cos + dy * sin;
      const localY = -dx * sin + dy * cos;

      // Check if point is within rectangle bounds in local space
      return localX >= -geom.w / 2 &&
        localX <= geom.w / 2 &&
        localY >= -geom.h / 2 &&
        localY <= geom.h / 2;
    } 
  }
    
};

registerShapeUtil(ShapeType.RECTANGLE, RectangleUtil);