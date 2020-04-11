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
    const [ x, y, w, h ] = selector.value.substring(11).split(',').map(parseFloat)
    return { x, y, w, h };
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
  const { x, y, w, h } = arg1.type === 'Annotation' ?
    parseRectFragment(arg1) : { x: arg1, y: arg2, w: arg3, h: arg4 };

  const g = document.createElementNS(SVG_NAMESPACE, 'g');

  const outerRect  = document.createElementNS(SVG_NAMESPACE, 'rect');
  const innerRect  = document.createElementNS(SVG_NAMESPACE, 'rect');

  innerRect.setAttribute('class', 'inner');
  setXYWH(innerRect, x + 0.5, y + 0.5, w - 1, h - 1);

  outerRect.setAttribute('class', 'outer');
  setXYWH(outerRect, x - 0.5, y - 0.5, w + 1, h + 1);

  g.appendChild(outerRect);
  g.appendChild(innerRect);

  return g;
}

/** Gets the (x, y, w, h)-values from the attributes of the SVG group **/
export const getRectSize = g => {
  const outerRect = g.querySelector('.outer');
  
  const x = parseFloat(outerRect.getAttribute('x')) + 0.5;
  const y = parseFloat(outerRect.getAttribute('y')) + 0.5;
  const w = parseFloat(outerRect.getAttribute('width')) - 1;
  const h = parseFloat(outerRect.getAttribute('height')) - 1;

  return { x, y, w, h };
}

/** Applies the (x, y, w, h)-values to the rects in the SVG group **/
export const setRectSize = (g, x, y, w, h) => {
  const innerRect = g.querySelector('.inner');
  const outerRect = g.querySelector('.outer');

  setXYWH(innerRect, x + 0.5, y + 0.5, w - 1, h - 1);
  setXYWH(outerRect, x - 0.5, y - 0.5, w + 1, h + 1);
}

/** 
 * Shorthand to get the area (rectangle w x h) from the 
 * annotation's fragment selector. 
 */
export const rectArea = annotation => {
  const { w, h } = parseRectFragment(annotation);
  return w * h;
}

