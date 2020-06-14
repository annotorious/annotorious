import { drawRect } from './RectFragment';
import { drawEmbeddedSVG } from './EmbeddedSVG';

const drawFn = {
  'FragmentSelector': drawRect,
  'SvgSelector': drawEmbeddedSVG
};

/** 
 * Evaluates the annotation target and picks the right drawing functions. 
 * 
 * We currently support the following selectors
 * - MediaFragment
 * - SVG (with embedded SVG shape)
 */
export const drawShape = annotation => {
  const firstTarget = annotation.targets[0];
  if (firstTarget) {
    const firstSelector = Array.isArray(firstTarget.selector) ? firstTarget.selector[0] : firstTarget.selector;
    console.log(firstSelector.type);
    return drawFn[firstSelector.type](annotation);
  }
}