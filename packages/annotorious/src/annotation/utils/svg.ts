import type { Bounds } from '../../model';

export const getMaskDimensions = (bounds: Bounds, buffer: number = 0) => {
  const { minX, minY, maxX, maxY } = bounds;
  return {
    x: minX - buffer,
    y: minY - buffer,
    w: maxX - minX + 2 * buffer,
    h: maxY - minY + 2 * buffer
  }
}