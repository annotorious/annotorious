import OpenSeadragon from 'openseadragon';
import { getOffsetPoint } from '@annotorious/annotorious';

export const getViewerOffsetPoint = (viewer: OpenSeadragon.Viewer, evt: PointerEvent): OpenSeadragon.Point => {
  const [x, y] = getOffsetPoint(viewer.element, evt);
  return new OpenSeadragon.Point(x, y);
}

export const viewerOffsetPointToImageXY = (viewer: OpenSeadragon.Viewer, xy: OpenSeadragon.Point): OpenSeadragon.Point => {
  const viewportPt = viewer.viewport.pointFromPixel(xy, true);

  if (viewer.viewport.getFlip()) {
    const bounds = viewer.viewport.getBoundsNoRotate(true);
    const centerX = bounds.x + bounds.width / 2;
    const flipped = new OpenSeadragon.Point(2 * centerX - viewportPt.x, viewportPt.y);
    return viewer.viewport.viewportToImageCoordinates(flipped);
  } else {
    return viewer.viewport.viewportToImageCoordinates(viewportPt);
  }
}
