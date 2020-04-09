import { SVG_NAMESPACE } from '../SVGConst';

/** Naive implementation (for now) that expects well-formed xywh=pixel: fragments **/
const parseRectFragment = annotation => {
  const selector = annotation.selector('FragmentSelector');
  if (selector) {
    const [ x, y, w, h ] = selector.value.substring(11).split(',').map(parseFloat)
    return { x, y, w, h };
  }
}

const setXYWH = (shape, x, y, w, h) => {
  shape.setAttribute('x', x);
  shape.setAttribute('y', y);
  shape.setAttribute('width', w);
  shape.setAttribute('height',  h);
}

/** 
 * Draws a rectangle from an annotation, or a tuple of
 * numbers (x, y, w, h)
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

export const setRectSize = (g, x, y, w, h) => {
  const innerRect = g.querySelector('.inner');
  const outerRect = g.querySelector('.outer');

  setXYWH(innerRect, x + 0.5, y + 0.5, w - 1, h - 1);
  setXYWH(outerRect, x - 0.5, y - 0.5, w + 1, h + 1);
}

