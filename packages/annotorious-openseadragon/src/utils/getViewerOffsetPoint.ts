import OpenSeadragon from 'openseadragon';
import { getOffsetPoint } from '@annotorious/annotorious';

export const getViewerOffsetPoint = (viewer: OpenSeadragon.Viewer, evt: PointerEvent): OpenSeadragon.Point => {
  const [x, y] = getOffsetPoint(viewer.element, evt);
  return new OpenSeadragon.Point(x, y);
}
