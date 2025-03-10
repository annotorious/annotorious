import { ShapeType } from '../Shape';
import type { ShapeUtil } from '../shapeUtils';
import { computePolygonArea, isPointInPolygon, registerShapeUtil } from '../shapeUtils';
import type { MultiPolygon } from './MultiPolygon';

const MultiPolygonUtil: ShapeUtil<MultiPolygon> = {

  area: (multiPolygon: MultiPolygon): number => {
    const { polygons } = multiPolygon.geometry;
    
    return polygons.reduce<number>((total, element) => {
      const [exterior, ...holes] = element.rings;
      
      const exteriorArea = computePolygonArea(exterior.points);
      
      const holesArea = holes.reduce<number>((total, hole) =>
        total + computePolygonArea(hole.points), 0);
      
      // Add this polygon's contribution to total area
      return total + exteriorArea - holesArea;
    }, 0);
  },

  intersects: (multiPolygon: MultiPolygon, x: number, y: number): boolean => {
    const { polygons } = multiPolygon.geometry;

    for (const element of polygons) {
      const [exterior, ...holes] = element.rings;
      
      if (isPointInPolygon(exterior.points, x, y)) {
        let insideAnyHole = false;
        
        for (const hole of holes) {
          if (isPointInPolygon(hole.points, x, y)) {
            insideAnyHole = true;
            break;
          }
        }
        
        if (!insideAnyHole) return true;
      }
    }

    return false;
  }
  
}

registerShapeUtil(ShapeType.MULTIPOLYGLON, MultiPolygonUtil);