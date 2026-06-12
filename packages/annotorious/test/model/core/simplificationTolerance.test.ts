import { describe, expect, it } from 'vitest';
import { ShapeType, simplifyMultiPolygon, simplifyPolygon } from '../../../src/model/core';
import type { MultiPolygon, Polygon } from '../../../src/model/core';

const detailedPoints: [number, number][] = [
  [0, 0],
  [1, 0.25],
  [2, -0.25],
  [3, 0.25],
  [4, 0],
  [4, 4],
  [3, 4.25],
  [2, 3.75],
  [1, 4.25],
  [0, 4],
  [0, 0]
];

const bounds = {
  minX: 0,
  minY: -0.25,
  maxX: 4,
  maxY: 4.25
};

describe('polygon simplification tolerance', () => {
  it('preserves polygon points when tolerance is zero', () => {
    const polygon: Polygon = {
      type: ShapeType.POLYGON,
      geometry: {
        bounds,
        points: detailedPoints
      }
    };

    expect(simplifyPolygon(polygon).geometry.points.length)
      .toBeLessThan(detailedPoints.length);

    expect(simplifyPolygon(polygon, 0).geometry.points)
      .toEqual(detailedPoints);
  });

  it('preserves multipolygon ring points when tolerance is zero', () => {
    const multiPolygon: MultiPolygon = {
      type: ShapeType.MULTIPOLYGON,
      geometry: {
        bounds,
        polygons: [{
          bounds,
          rings: [{
            points: detailedPoints
          }]
        }]
      }
    };

    expect(simplifyMultiPolygon(multiPolygon).geometry.polygons[0].rings[0].points.length)
      .toBeLessThan(detailedPoints.length);

    expect(simplifyMultiPolygon(multiPolygon, 0).geometry.polygons[0].rings[0].points)
      .toEqual(detailedPoints);
  });
});
