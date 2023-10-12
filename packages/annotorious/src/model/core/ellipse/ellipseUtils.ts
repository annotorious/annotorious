import { ShapeType } from '../Shape';
import { registerShapeUtil, type ShapeUtil } from '../shapeUtils';
import type { Ellipse } from './Ellipse';

const EllipseUtil: ShapeUtil<Ellipse> = {

  area: (e: Ellipse): number => Math.PI * e.geometry.rx * e.geometry.ry,

  intersects: (e: Ellipse, x: number, y: number): boolean => {
    const { cx, cy, rx, ry } = e.geometry;

    // For future use
    const rot = 0;

    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
  
    const dx  = x - cx;
    const dy  = y - cy;
  
    const tdx = cos * dx + sin * dy;
    const tdy = sin * dx - cos * dy;
  
    return (tdx * tdx) / (rx * rx) + (tdy * tdy) / (ry * ry) <= 1;
  }
};

registerShapeUtil(ShapeType.ELLIPSE, EllipseUtil);