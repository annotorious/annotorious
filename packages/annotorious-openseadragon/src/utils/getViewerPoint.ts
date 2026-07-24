import OpenSeadragon from 'openseadragon';

// Convert screen coordinates to the viewer's untransformed local coordinate
// system. OSD's viewport APIs expect these layout pixels, while PointerEvent
// offsets are inconsistent when an HTML ancestor is CSS-transformed.
export const getViewerPoint = (viewer: OpenSeadragon.Viewer, evt: PointerEvent): OpenSeadragon.Point => {
  const { left, top, width, height } = viewer.element.getBoundingClientRect();

  return new OpenSeadragon.Point(
    (evt.clientX - left) * (viewer.element.clientWidth / width),
    (evt.clientY - top) * (viewer.element.clientHeight / height)
  );
}
