import { Selection } from '@recogito/recogito-client-core';
import { SVG_NAMESPACE } from '../../util/SVG';
import { 
  drawCircle,
  drawCircleMask,
  setCircleSize,
  setCircleMaskSize,
  toCircleFragment
} from '../../selectors/CircleFragment';

/**
 * A 'rubberband' selection tool for creating a circle by
 * clicking and dragging.
 */
export default class RubberbandCircle {

  constructor(anchorX, anchorY, g, env) {
    this.anchor = [ anchorX, anchorY ];
    this.opposite = [ anchorX, anchorY ];

    this.env = env;

    this.group = document.createElementNS(SVG_NAMESPACE, 'g');

    this.mask = drawCircleMask(env.image, anchorX, anchorY, 2);
    this.mask.setAttribute('class', 'a9s-selection-mask');

    this.circle = drawCircle(anchorX, anchorY, 2);
    this.circle.setAttribute('class', 'a9s-selection');

    // We make the selection transparent to 
    // pointer events because it would interfere with the 
    // rendered annotations' mouseleave/enter events
    this.group.style.pointerEvents = 'none';

    // Additionally, selection remains hidden until 
    // the user actually moves the mouse
    this.group.style.display = 'none';

    this.group.appendChild(this.mask);
    this.group.appendChild(this.circle);

    g.appendChild(this.group);
  }

  get bbox() {
    const w = this.opposite[0] - this.anchor[0];
    const h = this.opposite[1] - this.anchor[1];

    return {
      cx: w > 0 ? this.anchor[0] + w/2 : this.opposite[0] + w/2,
      cy: h > 0 ? this.anchor[1] + h/2 : this.opposite[1] + h/2,
      r: Math.max(1, Math.pow(w**2 + h**2, 0.5)/2), // Negative values
    };
  }

  get element() {
    return this.circle;
  }

  dragTo = (oppositeX, oppositeY) => {
    // Make visible
    this.group.style.display = null;

    this.opposite = [ oppositeX, oppositeY ];
    const { cx, cy, r} = this.bbox;
    setCircleMaskSize(this.mask, this.env.image, cx, cy, r);
    setCircleSize(this.circle, cx, cy, r);
  }

  getBoundingClientRect = () => 
    this.circle.getBoundingClientRect();

  toSelection = () => {
    const { cx, cy, r} = this.bbox;
    return new Selection(toCircleFragment(cx, cy, r, this.env.image));
  }

  destroy = () => {
    this.group.parentNode.removeChild(this.group);

    this.mask = null;
    this.circle = null;
    this.group = null;
  }

}