import { SVG_NAMESPACE } from '../../util/SVG';

/** Shorthand to apply the given (x, y, r) to the SVG shape **/
const setXYR = (shape, x, y, r) => {  
  shape.setAttribute('cx', x);
  shape.setAttribute('cy', y);
  shape.setAttribute('r', r);
}

/** 
 * Draws an SVG circle, either from an annotation, or an
 * (cx, cy, r)-tuple.
 */
export const drawCircle = (cx, cy, r) => {
  const g = document.createElementNS(SVG_NAMESPACE, 'g');
  const outerCircle  = document.createElementNS(SVG_NAMESPACE, 'circle');
  const innerCircle  = document.createElementNS(SVG_NAMESPACE, 'circle');

  innerCircle.setAttribute('class', 'a9s-inner');
  setXYR(innerCircle, cx, cy, r);

  outerCircle.setAttribute('class', 'a9s-outer');
  setXYR(outerCircle, cx, cy, r);

  g.appendChild(outerCircle);
  g.appendChild(innerCircle);

  return g;
}

export const setCircleSize = (g, cx, cy, r) => {
  const innerCircle = g.querySelector('.a9s-inner');
  const outerCircle = g.querySelector('.a9s-outer');
  
  setXYR(innerCircle, cx, cy, r);
  setXYR(outerCircle, cx, cy, r);
}

export const getCircleSize = g => {
  const outerCircle = g.querySelector('.a9s-outer');

  const cx = parseFloat(outerCircle.getAttribute('cx'));
  const cy = parseFloat(outerCircle.getAttribute('cy'));
  const r = parseFloat(outerCircle.getAttribute('r'));
  
  return { cx, cy, r };
}