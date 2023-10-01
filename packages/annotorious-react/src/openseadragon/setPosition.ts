import { ImageAnnotation } from '@annotorious/annotorious';
import OpenSeadragon from 'openseadragon';

const getAnnotationDomRect = (viewer: OpenSeadragon.Viewer, annotation: ImageAnnotation) => {
  // Annotation bounds (image coordinates)
  const { minX, minY, maxX, maxY } = annotation.target.selector.geometry.bounds;

  // Annotation coordinates - viewer element coordinates
  const topLeft = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(minX, minY));
  const bottomRight = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(maxX, maxY));

  return { 
    x: topLeft.x, 
    right: bottomRight.x,
    y: topLeft.y, 
    bottom: bottomRight.y,
    width: bottomRight.x - topLeft.x, 
    height: bottomRight.y - topLeft.y 
  };
}

export const setPosition = (
  viewer: OpenSeadragon.Viewer, 
  annotation: ImageAnnotation, 
  popup: HTMLElement,
  sideOffset: number = 5
) => {
  const viewerBounds = viewer.element.getBoundingClientRect();
  const annoBounds = getAnnotationDomRect(viewer, annotation);

  // Available space above, right, below, left the annotation in the viewport
  const availableAbove = annoBounds.y - viewerBounds.y;
  const availableRight = viewerBounds.right - annoBounds.x;
  const availableBelow = viewerBounds.bottom - annoBounds.bottom;
  const availableLeft = annoBounds.x - viewerBounds.left;

  // Popup element bounds
  const popupBounds = popup.firstElementChild.getBoundingClientRect();

  // Eight possible base alignment anchor points
  //
  //            topleft        topright
  //            *                     *
  // leftdown * |---------------------| * rightdown
  //            |                     |
  //            |                     |
  //            |                     |
  //   leftup * |---------------------| * rightup
  //            *                     * 
  //            bottomleft  bottomright
  //
  // We'll position the popup at the cardinal direction
  // with the highest ratio: available space vs. popup size.
  const ratioAbove = availableAbove / popupBounds.height;
  const ratioRight = availableRight / popupBounds.width;
  const ratioBelow = availableBelow / popupBounds.height;
  const ratioLeft = availableLeft / popupBounds.width;

  const topleft = () => {
    popup.style.left = `${annoBounds.x}px`;
    popup.style.top = `${annoBounds.y - sideOffset - popupBounds.height}px`;
  }

  const topright = () => {
    popup.style.left = `${annoBounds.right - popupBounds.width}px`;
    popup.style.top = `${annoBounds.y - sideOffset - popupBounds.height}px`;
  }

  const leftdown = () => {
    popup.style.left = `${annoBounds.x - popupBounds.width - sideOffset}px`;
    popup.style.top = `${annoBounds.y}px`;
  } 

  const rightdown = () => {
    popup.style.left = `${annoBounds.right + sideOffset}px`;
    popup.style.top = `${annoBounds.y}px`;
  }

  const leftup = () => {
    popup.style.left = `${annoBounds.x - popupBounds.width - sideOffset}px`;
    popup.style.top = `${annoBounds.bottom - popupBounds.height}px`;
  }

  const rightup = () => {
    popup.style.left = `${annoBounds.x + annoBounds.width + sideOffset}px`;
    popup.style.top = `${annoBounds.bottom - popupBounds.height}px`;
  }

  const bottomleft = () => {
    popup.style.left = `${annoBounds.x}px`;
    popup.style.top = `${annoBounds.bottom + sideOffset}px`;
  }

  const bottomright = () => {
    popup.style.left = `${annoBounds.right - popupBounds.width}px`;
    popup.style.top = `${annoBounds.bottom + sideOffset}px`;
  }

  const ratios = [ratioAbove, ratioRight, ratioBelow, ratioLeft];
  const maxIdx = ratios.indexOf(Math.max(...ratios));

  if (maxIdx === 0) {
    // Main orientation: above
    if (ratioRight > ratioLeft)
      topleft();
    else 
      topright();
  } else if (maxIdx === 1) {
    // Main orientation: right
    if (ratioAbove > ratioBelow)
      rightup();
    else
      rightdown();
  } else if (maxIdx === 2) {
    // Main orientation: below
    if (ratioRight > ratioLeft)
      bottomleft();
    else
      bottomright();
  } else {
    // Main orientation: left
    if (ratioAbove > ratioBelow)
      leftup();
    else 
      leftdown();
  }
}