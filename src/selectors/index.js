import { drawRect, rectArea } from './RectFragment';
import { drawEmbeddedSVG } from './EmbeddedSVG';
import {drawCircle, circleArcea} from "./CircleFragment";

// Drawing functions per selector type
const drawFn = {
  'FragmentSelector': drawRect,
  'SvgSelector': drawEmbeddedSVG,
  'CircleFragmentSelector': drawCircle,
};

// Area computation functions per selector type
const areaFn = {
  'FragmentSelector': rectArea,
  'SvgSelector': () => 0, // TODO,
  'CircleFragmentSelector': circleArcea,
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
export const drawShape = annotation =>
  drawFn[getFirstSelector(annotation).type](annotation);


export const shapeArea = annotation =>
  areaFn[getFirstSelector(annotation).type](annotation);

export { parseRectFragment } from './RectFragment';

