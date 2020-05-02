import { SVG_NAMESPACE } from '../SVGConst';

/** 
 * Parses a W3C Web Annotation FragmentSelector conforming
 * to the Media Fragments spec. This (currently) naive 
 * implementation can only deal with well-formed xywh=pixel
 * fragments. 
 */
export const parseRectFragment = annotation => {
  const selector = annotation.selector('FragmentSelector');
  if (selector?.conformsTo.startsWith('http://www.w3.org/TR/media-frags')) {
    const { value } = selector;
    const format = value.includes(':') ? value.substring(value.indexOf('=') + 1, value.indexOf(':')) : 'pixel';

    const coords = value.includes(':') ? value.substring(value.indexOf(':') + 1) : value.substring(value.indexOf('=') + 1); 
    const [ x, y, w, h ] = coords.split(',').map(parseFloat)

    return { x, y, w, h, format };
  }
}

/** Serializes a (x, y, w, h)-tuple as Media Fragment selector **/
export const toRectFragment = (x, y, w, h) => ({
  "type": "FragmentSelector",
  "conformsTo": "http://www.w3.org/TR/media-frags/",
  "value": `xywh=pixel:${x},${y},${w},${h}`
});

/** Shorthand to apply the given (x, y, w, h) to the SVG shape **/
const setXYWH = (shape, x, y, w, h) => {
  shape.setAttribute('x', x);
  shape.setAttribute('y', y);
  shape.setAttribute('width', w);
  shape.setAttribute('height',  h);
}

/** 
 * Draws an SVG rectangle, either from an annotation, or an
 * (x, y, w, h)-tuple.
 */
export const drawRect = (arg1, arg2, arg3, arg4) => {
  const { x, y, w, h } = arg1.type === 'Annotation' || arg1.type === 'Selection' ?
    parseRectFragment(arg1) : { x: arg1, y: arg2, w: arg3, h: arg4 };

  const g = document.createElementNS(SVG_NAMESPACE, 'g');

  const outerRect  = document.createElementNS(SVG_NAMESPACE, 'rect');
  const innerRect  = document.createElementNS(SVG_NAMESPACE, 'rect');

  innerRect.setAttribute('class', 'inner');
  setXYWH(innerRect, x, y, w, h);

  outerRect.setAttribute('class', 'outer');
  setXYWH(outerRect, x, y, w, h);

  g.appendChild(outerRect);
  g.appendChild(innerRect);

  return g;
}

/** Gets the (x, y, w, h)-values from the attributes of the SVG group **/
export const getRectSize = g => {
  const outerRect = g.querySelector('.outer');
  
  const x = parseFloat(outerRect.getAttribute('x'));
  const y = parseFloat(outerRect.getAttribute('y'));
  const w = parseFloat(outerRect.getAttribute('width'));
  const h = parseFloat(outerRect.getAttribute('height'));

  return { x, y, w, h };
}

/** Returns corner coordinates for the given SVG group **/
export const getCorners = g => {
  const { x, y, w, h } = getRectSize(g);
  return [
    { x: x,     y: y },
    { x: x + w, y: y },
    { x: x + w, y: y + h },
    { x: x,     y: y + h}
  ];
}

/** Applies the (x, y, w, h)-values to the rects in the SVG group **/
export const setRectSize = (g, x, y, w, h) => {
  const innerRect = g.querySelector('.inner');
  const outerRect = g.querySelector('.outer');

  setXYWH(innerRect, x, y, w, h);
  setXYWH(outerRect, x, y, w, h);
}

/** 
 * Shorthand to get the area (rectangle w x h) from the 
 * annotation's fragment selector. 
 */
export const rectArea = annotation => {
  const { w, h } = parseRectFragment(annotation);
  return w * h;
}

