import { ShapeType } from '../Shape';
import type { Rectangle } from './Rectangle';
import { registerShapeUtil, type ShapeUtil } from '../shapeUtils';

export const RectangleUtil: ShapeUtil<Rectangle> = {

  area: (rect: Rectangle): number => rect.geometry.w * rect.geometry.h,

  intersects: (rect: Rectangle, x: number, y: number): boolean =>
    x >= rect.geometry.x &&
    x <= rect.geometry.x + rect.geometry.w &&
    y >= rect.geometry.y &&
    y <= rect.geometry.y + rect.geometry.h
    
};

registerShapeUtil(ShapeType.RECTANGLE, RectangleUtil);