import OpenSeadragon from 'openseadragon';
import { getElementPoint } from '@annotorious/annotorious';

// Convert screen coordinates to the viewer's untransformed local coordinate
// system. OSD's viewport APIs expect these layout pixels, while PointerEvent
// offsets are inconsistent when an HTML ancestor is CSS-transformed.
export const getViewerPoint = (viewer: OpenSeadragon.Viewer, evt: PointerEvent): OpenSeadragon.Point => {
  const [x, y] = getElementPoint(viewer.element, evt);
  return new OpenSeadragon.Point(x, y);
}
