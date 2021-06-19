import { Selection } from '@recogito/recogito-client-core';
import { toSVGTarget } from '../../selectors/EmbeddedSVG';
import { SVG_NAMESPACE } from '../../util/SVG';
import { drawCircle, setCircleSize } from './Circle';

/**
 * A 'rubberband' selection tool for creating a circle by
 * clicking and dragging.
 */
export default class RubberbandCircle {

  constructor(anchorX, anchorY, g, env) {
    this.anchor = [ anchorX, anchorY ];

    this.env = env;

    this.group = document.createElementNS(SVG_NAMESPACE, 'g');

    // this.mask = drawCircleMask(env.image, anchorX, anchorY, 2);
    // this.mask.setAttribute('class', 'a9s-selection-mask');

    this.circle = drawCircle(anchorX, anchorY, 2);
    this.circle.setAttribute('class', 'a9s-selection');

    // We make the selection transparent to 
    // pointer events because it would interfere with the 
    // rendered annotations' mouseleave/enter events
    this.group.style.pointerEvents = 'none';

    // Additionally, selection remains hidden until 
    // the user actually moves the mouse
    this.group.style.display = 'none';

    // this.group.appendChild(this.mask);
    this.group.appendChild(this.circle);

    g.appendChild(this.group);
  }

  get element() {
    return this.circle;
  }

  dragTo = (oppositeX, oppositeY) => {
    // Make visible
    this.group.style.display = null;

    const w = oppositeX - this.anchor[0];
    const h = oppositeY - this.anchor[1];

    const cx = w > 0 ? this.anchor[0] + w / 2 : oppositeX + w / 2;
    const cy = h > 0 ? this.anchor[1] + h / 2 : oppositeY + h / 2;

    const r = Math.max(1, Math.pow(w ** 2 + h ** 2, 0.5) / 2); // Negative values

    // setCircleMaskSize(this.mask, this.env.image, cx, cy, r);
    setCircleSize(this.circle, cx, cy, r);
  }

  getBoundingClientRect = () => 
    this.circle.getBoundingClientRect();

  toSelection = () => {
    return new Selection(toSVGTarget(this.group, this.env.image));
  }

  destroy = () => {
    this.group.parentNode.removeChild(this.group);

    this.mask = null;
    this.circle = null;
    this.group = null;
  }

}