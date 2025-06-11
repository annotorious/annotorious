import type { MultiPolygonGeometry } from '../../../model';

/** Minimum distance (px) between corners required for midpoints to show **/
const MIN_VISIBILITY_DISTANCE = 12;

export interface MultipolygonMidpoint {

  point: [number, number];

  visible: boolean;

  elementIdx: number;

  ringIdx: number;

  pointIdx: number;

}

export const computeMidpoints = (geom: MultiPolygonGeometry, viewportScale: number) =>
  geom.polygons.reduce<MultipolygonMidpoint[]>((all, element, elementIdx) => {
    const forThisPolygon = element.rings.reduce<MultipolygonMidpoint[]>((forThisPolygon, ring, ringIdx) => {
      const forThisRing: MultipolygonMidpoint[] = ring.points.map((thisPoint, pointIdx) => {
        const nextPoint = pointIdx === ring.points.length - 1 ? ring.points[0] : ring.points[pointIdx + 1];

        const x = (thisPoint[0] + nextPoint[0]) / 2;
        const y = (thisPoint[1] + nextPoint[1]) / 2;

        const dist = Math.sqrt( 
          Math.pow(nextPoint[0] - x, 2) + Math.pow(nextPoint[1] - y, 2));

        // Don't show if the distance between the corners is too small
        const visible = dist > MIN_VISIBILITY_DISTANCE / viewportScale;

        return { point: [x, y], visible, elementIdx, ringIdx, pointIdx };
      });

      return [...forThisPolygon, ...forThisRing];
    }, []);

    return [...all, ...forThisPolygon];
  }, []);