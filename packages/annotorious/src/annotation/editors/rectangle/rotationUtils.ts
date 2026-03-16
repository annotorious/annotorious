import type { Bounds, RectangleGeometry } from '../../../model';

/**
 * Rotates a point around a center by the given angle (in rad).
 */
export const rotatePoint = (
  point: [number, number],
  center: [number, number],
  angle: number
): [number, number] => {
  const [px, py] = point;
  const [cx, cy] = center;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const dx = px - cx;
  const dy = py - cy;

  return [
    cx + dx * cos - dy * sin,
    cy + dx * sin + dy * cos
  ];
}

/**
 * Gets the four corner points of a rotated rectangle in world space.
 */
export const getRotatedCorners = (
  x: number,
  y: number,
  w: number,
  h: number,
  rot: number
): [[number, number], [number, number], [number, number], [number, number]] => {
  const corners: [number, number][] = [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h]
  ];

  const center: [number, number] = [x + w / 2, y + h / 2];

  return corners.map(corner => 
    rotatePoint(corner, center, rot)) as [[number, number], [number, number], [number, number], [number, number]];
}

/** 
 * Calculates the position of the rotation handle.
 */
export const getRotationHandlePosition = (
  geom: RectangleGeometry, offset: number
): [number, number] => {
  const { x , y, w, h, rot } = geom;
  const center: [number, number] = [x + w / 2, y + h / 2];
  let topCenter: [number, number] = [x + w / 2, y - offset];
  return rotatePoint(topCenter, center, rot);
}

/**
 * Transforms a movement delta from world coords to the rectangle's 
 * local (non-rotated) coordinate system.
 */
export const transformDeltaToLocalCoords = (
  deltaX: number,
  deltaY: number,
  rot: number
): [number, number] => {
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);

  return [
    deltaX * cos + deltaY * sin,
    -deltaX * sin + deltaY * cos
  ];
}

/**
 * Calculates the rotation angle between a point and the origin, relative to a center.
 */
export const angleFromPoints = (
  point1: [number, number],
  point2: [number, number],
  center: [number, number]
): number => {
  const dx1 = point1[0] - center[0];
  const dy1 = point1[1] - center[1];
  const angle1 = Math.atan2(dy1, dx1);

  const dx2 = point2[0] - center[0];
  const dy2 = point2[1] - center[1];
  const angle2 = Math.atan2(dy2, dx2);

  return angle2 - angle1;
}

/**
 * Snaps an angle to the nearest 45-degree increment
 */
export const snapAngle = (angle: number, inc = 10): number => {
  const step = (inc * Math.PI) / 180;
  return Math.round(angle / step) * step;
}
