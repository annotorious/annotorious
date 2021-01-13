import { SVG_NAMESPACE } from '../util/SVG';

/** 
 * Parses a W3C Web Annotation FragmentSelector conforming
 * to the Media Fragments spec. This (currently) naive 
 * implementation can only deal with well-formed xywh=pixel
 * fragments. 
 */
//TODO
export const parseCircleFragment = annotation => {
  const selector = annotation.selector('CircleFragmentSelector');
  if (selector?.conformsTo.startsWith('http://www.w3.org/TR/media-frags')) {
    const { value } = selector;
    const format = value.includes(':') ? value.substring(value.indexOf('=') + 1, value.indexOf(':')) : 'pixel';

    const coords = value.includes(':') ? value.substring(value.indexOf(':') + 1) : value.substring(value.indexOf('=') + 1); 
    const [ cx, cy, r] = coords.split(',').map(parseFloat)
    return { cx, cy, r, format };
  }
}

/** Serializes a (x, y, r)-tuple as Media Fragment selector **/
export const toCircleFragment = (x, y, r, image) => ({
  source: image.src,
  selector: {
    type: "CircleFragmentSelector",
    conformsTo: "http://www.w3.org/TR/media-frags/",
    value: `xyr=pixel:${x},${y},${r}`
  }
});

/** Shorthand to apply the given (x, y, r) to the SVG shape **/
const setXYR = (shape, x, y, r) => {
  shape.setAttribute('cx', x);
  shape.setAttribute('cy', y);
  shape.setAttribute('r', r);
}

export const drawCircleMask = (imageDimensions, x, y, r) => {
  const mask = document.createElementNS(SVG_NAMESPACE, 'path');
  mask.setAttribute('fill-rule', 'evenodd');
  
  const { naturalWidth, naturalHeight } = imageDimensions;
  // mask.setAttribute('d', `M0 0 h${naturalWidth} v${naturalHeight} h-${naturalWidth} z M${x} ${y} r${r}`);

  return mask;
}

export const setCircleMaskSize = (mask, imageDimensions, x, y, r) => {
  const { naturalWidth, naturalHeight } = imageDimensions;
  // console.log('setCirclemask',x, y, r);
  // mask.setAttribute('d', `M0 0 h${naturalWidth} v${naturalHeight} h-${naturalWidth} z M${x} ${y} r${r}`);
}

/** 
 * Draws an SVG rectangle, either from an annotation, or an
 * (x, y, w, h)-tuple.
 */
//TODO dependent on parseCircleFragment
export const drawCircle = (arg1, arg2, arg3) => {
  const { cx, cy, r} = arg1.type === 'Annotation' || arg1.type === 'Selection' ?
    parseCircleFragment(arg1) : { cx: arg1, cy: arg2, r: arg3};

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

/** Gets the (x, y, w, h)-values from the attributes of the SVG group **/
export const getCircleSize = g => {
  const outerCircle = g.querySelector('.a9s-outer');
  const cx = parseFloat(outerCircle.getAttribute('cx'));
  const cy = parseFloat(outerCircle.getAttribute('cy'));
  const r = parseFloat(outerCircle.getAttribute('r'));
  return { cx, cy, r};
}

/** Returns corner coordinates for the given SVG group **/
//TODO
export const getCorners = g => {
  const { cx, cy, r} = getCircleSize(g);
  return [
    { x: cx,     y: cy -r},
    { x: cx + r,     y: cy },
    { x: cx,     y: cy + r},
    { x: cx - r,     y: cy }
  ];
}

/** Applies the (x, y, w, h)-values to the rects in the SVG group **/
export const setCircleSize = (g, cx, cy, r) => {
  const innerCircle = g.querySelector('.a9s-inner');
  const outerCircle = g.querySelector('.a9s-outer');
  setXYR(innerCircle, cx, cy, r);
  setXYR(outerCircle, cx, cy, r);
}

/** 
 * Shorthand to get the area (rectangle w x h) from the 
 * annotation's fragment selector. 
 */
export const circleArcea = annotation => {
  const {r} = parseCircleFragment(annotation);
  return 3.1415*r*r;
}

