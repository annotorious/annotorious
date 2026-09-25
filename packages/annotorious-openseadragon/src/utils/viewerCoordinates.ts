import OpenSeadragon from 'openseadragon';
import { getOffsetPoint } from '@annotorious/annotorious';

export const getViewerOffsetPoint = (viewer: OpenSeadragon.Viewer, evt: PointerEvent): OpenSeadragon.Point => {
  const [x, y] = getOffsetPoint(viewer.element, evt);
  return new OpenSeadragon.Point(x, y);
}

export const viewerOffsetPointToImageXY = (
  viewer: OpenSeadragon.Viewer,
  xy: OpenSeadragon.Point
): OpenSeadragon.Point => {
  const viewport = viewer.viewport;

  if (viewport.getFlip()) {
    const containerSize = viewport.getContainerSize();

    // Mirror X across container center
    const px = containerSize.x - xy.x;
    const py = xy.y;

    // Map mirrored coords to un-rotated viewport coords
    const bounds = viewport.getBoundsNoRotate(true);
    const unrotatedVx = bounds.x + (px / containerSize.x) * bounds.width;
    const unrotatedVy = bounds.y + (py / containerSize.x) * bounds.width;

    const rotation = viewport.getRotation(true);

    if (rotation === 0) {
      // Quicker path if flip but no rotation
      return viewport.viewportToImageCoordinates(new OpenSeadragon.Point(unrotatedVx, unrotatedVy));
    } else {
      // Flip + rotation: counter-rotate viewport point around viewport center
      const center = viewport.getCenter(true);
      const rad = (-rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const dvx = unrotatedVx - center.x;
      const dvy = unrotatedVy - center.y;

      const finalVx = center.x + dvx * cos - dvy * sin;
      const finalVy = center.y + dvx * sin + dvy * cos;

      return viewport.viewportToImageCoordinates(new OpenSeadragon.Point(finalVx, finalVy));
    }
  } else {
    // Quick path if viewport is not flipped
    return viewport.viewportToImageCoordinates(viewport.pointFromPixel(xy, true));
  }
}