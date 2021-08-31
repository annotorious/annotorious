import { drawRect, rectArea } from './RectFragment';
import { drawEmbeddedSVG, svgArea } from './EmbeddedSVG';

// Drawing functions per selector type
const drawFn = {
  'FragmentSelector': drawRect,
  'SvgSelector': drawEmbeddedSVG
};

// Area computation functions per selector type
const areaFn = {
  'FragmentSelector': rectArea,
  'SvgSelector': svgArea
}

// Helper to get the first selector from an annotation
const getFirstSelector = annotation => {
  const firstTarget = annotation.targets[0];
  if (firstTarget)
    return Array.isArray(firstTarget.selector) ? firstTarget.selector[0] : firstTarget.selector;
}

/** 
 * Evaluates the annotation target and picks the right drawing functions. 
 * 
 * We currently support the following selectors
 * - MediaFragment
 * - SVG (with embedded SVG shape)
 */
export const drawShape = (annotation, image) =>
  drawFn[getFirstSelector(annotation).type](annotation, image);

export const shapeArea = (annotation, image) =>
  areaFn[getFirstSelector(annotation).type](annotation, image);

export { parseRectFragment } from './RectFragment';

export * from './EmbeddedSVG';
export * from './RectFragment';


