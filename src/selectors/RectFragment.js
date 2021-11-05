import { SVG_NAMESPACE } from '../util/SVG';

/** 
 * Parses a W3C Web Annotation FragmentSelector conforming
 * to the Media Fragments spec. Supports (well-formed) xywh=pixel
 * and xywh=percent fragments. 
 */
export const parseRectFragment = (annotation, image) => {
  const selector = annotation.selector('FragmentSelector');

  if (selector?.conformsTo.startsWith('http://www.w3.org/TR/media-frags')) {
    const { value } = selector;
  
    const format = value.includes(':') ? value.substring(value.indexOf('=') + 1, value.indexOf(':')) : 'pixel';
    const coords = value.includes(':') ? value.substring(value.indexOf(':') + 1) : value.substring(value.indexOf('=') + 1);

    let [ x, y, w, h ] = coords.split(',').map(parseFloat);

    if (format.toLowerCase() === 'percent') {
      x = x * image.naturalWidth  / 100;
      y = y * image.naturalHeight / 100;
      w = w * image.naturalWidth  / 100;
      h = h * image.naturalHeight / 100;
    }

    return { x, y, w, h };
  }
}

/** 
 * Serializes a (x, y, w, h)-tuple as Media Fragment selector
 * using pixel coordinates.
 */
const toPixelRectFragment = (x, y, w, h, image) => ({
  source: image?.src,
  selector: {
    type: "FragmentSelector",
    conformsTo: "http://www.w3.org/TR/media-frags/",
    value: `xywh=pixel:${x},${y},${w},${h}`
  }
});

/** 
 * Serializes a (x, y, w, h)-tuple as Media Fragment selector 
 * using percent coordinates.
 */
const toPercentRectFragment = (x, y, w, h, image) => {
  const px = x / image.naturalWidth  * 100;
  const py = y / image.naturalHeight * 100;
  const pw = w / image.naturalWidth  * 100;
  const ph = h / image.naturalHeight * 100;

  return {
    source: image.src,
    selector: {
      type: "FragmentSelector",
      conformsTo: "http://www.w3.org/TR/media-frags/",
      value: `xywh=percent:${px},${py},${pw},${ph}`
    }
  }
}

export const toRectFragment = (x, y, w, h, image, fragmentUnit) =>
  fragmentUnit?.toLowerCase() === 'percent' ?
    toPercentRectFragment(x, y, w, h, image) :
    toPixelRectFragment(x, y, w, h, image);

/** Shorthand to apply the given (x, y, w, h) to the SVG shape **/
const setXYWH = (shape, x, y, w, h) => {
  shape.setAttribute('x', x);
  shape.setAttribute('y', y);
  shape.setAttribute('width', w);
  shape.setAttribute('height', h);
}


const setPointXY = (shape, x, y) => {
  shape.setAttribute('cx', x);
  shape.setAttribute('cy', y);
  shape.setAttribute('r', 7); // TODO make configurable
}

export const drawRectMask = (imageDimensions, x, y, w, h) => {
  const mask = document.createElementNS(SVG_NAMESPACE, 'path');
  mask.setAttribute('fill-rule', 'evenodd');

  const { naturalWidth, naturalHeight } = imageDimensions;
  mask.setAttribute('d', `M0 0 h${naturalWidth} v${naturalHeight} h-${naturalWidth} z M${x} ${y} h${w} v${h} h-${w} z`);

  return mask;
}

export const setRectMaskSize = (mask, imageDimensions, x, y, w, h) => {
  const { naturalWidth, naturalHeight } = imageDimensions;
  mask.setAttribute('d', `M0 0 h${naturalWidth} v${naturalHeight} h-${naturalWidth} z M${x} ${y} h${w} v${h} h-${w} z`);
}

/** 
 * Draws an SVG rectangle, either from an annotation, or an
 * (x, y, w, h)-tuple.
 */
export const drawRect = (arg1, arg2, arg3, arg4) => {
  const { x, y, w, h } = arg1.type === 'Annotation' || arg1.type === 'Selection' ?
    parseRectFragment(arg1, arg2) : { x: arg1, y: arg2, w: arg3, h: arg4 };

  const g = document.createElementNS(SVG_NAMESPACE, 'g');

  if (w === 0 && h === 0) {
    // Edge case: rect is actually a point
    const pointGroup = document.createElementNS(SVG_NAMESPACE, 'g');
    pointGroup.setAttribute('class', 'a9s-point a9s-non-scaling');
    pointGroup.setAttribute('transform-origin', `${x} ${y}`);

    const outerPoint  = document.createElementNS(SVG_NAMESPACE, 'circle');
    const innerPoint  = document.createElementNS(SVG_NAMESPACE, 'circle');

    innerPoint.setAttribute('class', 'a9s-inner');
    setPointXY(innerPoint, x, y);

    outerPoint.setAttribute('class', 'a9s-outer');
    setPointXY(outerPoint, x, y);

    pointGroup.appendChild(outerPoint);
    pointGroup.appendChild(innerPoint);  
    
    g.appendChild(pointGroup);
  } else {
    const outerRect = document.createElementNS(SVG_NAMESPACE, 'rect');
    const innerRect = document.createElementNS(SVG_NAMESPACE, 'rect');

    innerRect.setAttribute('class', 'a9s-inner');
    setXYWH(innerRect, x, y, w, h);

    outerRect.setAttribute('class', 'a9s-outer');
    setXYWH(outerRect, x, y, w, h);

    g.appendChild(outerRect);
    g.appendChild(innerRect);
  }

  return g;
}

/** Gets the (x, y, w, h)-values from the attributes of the SVG group **/
export const getRectSize = g => {
  const outer = g.querySelector('.a9s-outer');

  if (outer.nodeName === 'rect') {
    const x = parseFloat(outer.getAttribute('x'));
    const y = parseFloat(outer.getAttribute('y'));
    const w = parseFloat(outer.getAttribute('width'));
    const h = parseFloat(outer.getAttribute('height'));

    return { x, y, w, h };
  } else {
    const x = parseFloat(outer.getAttribute('cx'));
    const y = parseFloat(outer.getAttribute('cy'));

    return { x, y, w: 0, h: 0 };
  }
}

/** Applies the (x, y, w, h)-values to the rects in the SVG group **/
export const setRectSize = (g, x, y, w, h) => {
  const inner = g.querySelector('.a9s-inner');
  const outer = g.querySelector('.a9s-outer');

  if (outer.nodeName === 'rect') {
    setXYWH(inner, x, y, w, h);
    setXYWH(outer, x, y, w, h);  
  } else {
    setPointXY(inner, x, y);
    setPointXY(outer, x, y);
  }
}

/** 
 * Shorthand to get the area (rectangle w x h) from the 
 * annotation's fragment selector. 
 */
export const rectArea = (annotation, image) => {
  const { w, h } = parseRectFragment(annotation, image);
  return w * h;
}

