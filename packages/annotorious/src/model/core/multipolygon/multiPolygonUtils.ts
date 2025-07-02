import { ShapeType } from '../Shape';
import type { ShapeUtil } from '../shapeUtils';
import { boundsFromPoints, computePolygonArea, isPointInPolygon, pointsToPath, registerShapeUtil, simplifyPoints } from '../shapeUtils';
import type { MultiPolygon, MultiPolygonElement, MultiPolygonGeometry, MultiPolygonRing } from './MultiPolygon';

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

export const boundsFromMultiPolygonElements = (elements: MultiPolygonElement[]) => {
  // All outer points, i.e. the points of each outer ring for each element
  const outerPoints = elements.reduce<[number, number][]>((points, element) => {
    return [...points, ...element.rings[0].points];
  }, []);

  return boundsFromPoints(outerPoints);
}

export const multipolygonElementToPath = (element: MultiPolygonElement) => {
  const paths = element.rings.map(ring => pointsToPath(ring.points));
  return paths.join(' ');
}

export const getAllCorners = (geom: MultiPolygonGeometry) => 
  geom.polygons.reduce<[number, number][]>((all, element) => (
    [
      ...all, 
      ...element.rings.reduce<[number, number][]>((onThisElement, ring) => (
        [...onThisElement, ...ring.points]
      ), [])
    ]
  ), []);

export const simplifyMultiPolygon = (multi: MultiPolygon, tolerance = 1): MultiPolygon => {
  const polygons = multi.geometry.polygons.map(polygon => {
    const rings: MultiPolygonRing[] = polygon.rings.map(ring => {
      const points = simplifyPoints(ring.points, tolerance);
      return {
        ...ring,
        points
      }
    });

    const bounds = boundsFromPoints(rings[0].points);

    return {
      ...polygon,
      rings,
      bounds
    }
  });

  const bounds = boundsFromMultiPolygonElements(polygons);

  return {
    ...multi,
    geometry: {
      ...multi.geometry,
      polygons,
      bounds
    }
  }
}

registerShapeUtil(ShapeType.MULTIPOLYGON, MultiPolygonUtil);