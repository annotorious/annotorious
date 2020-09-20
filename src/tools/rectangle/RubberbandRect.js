import { Selection } from '@recogito/recogito-client-core';
import { SVG_NAMESPACE } from '../../SVG';
import { 
  drawRect, 
  drawRectMask,
  setRectSize, 
  setRectMaskSize,
  toRectFragment 
} from '../../annotations/selectors/RectFragment';

/**
 * A 'rubberband' selection tool for creating a rectangle by
 * clicking and dragging.
 */
export default class RubberbandRect {

  constructor(anchorX, anchorY, g) {
    this.anchor = [ anchorX, anchorY ];
    this.opposite = [ anchorX, anchorY ];

    this.shape = document.createElementNS(SVG_NAMESPACE, 'g');
    
    this.mask = drawRectMask(g.closest('svg'), anchorX, anchorY, 2, 2);
    this.mask.setAttribute('class', 'a9s-selection-mask');

    this.rect = drawRect(anchorX, anchorY, 2, 2);
    this.rect.setAttribute('class', 'a9s-selection');

    // We make the selection transparent to 
    // pointer events because it would interfere with the 
    // rendered annotations' mouseleave/enter events
    this.shape.style.pointerEvents = 'none';

    // Additionally, selection remains hidden until 
    // the user actually moves the mouse
    this.shape.style.display = 'none';

    this.shape.appendChild(this.mask);
    this.shape.appendChild(this.rect);
    g.appendChild(this.shape);
  }

  get bbox() {
    const w = this.opposite[0] - this.anchor[0];
    const h = this.opposite[1] - this.anchor[1];

    return {
      x: w > 0 ? this.anchor[0] : this.opposite[0],
      y: h > 0 ? this.anchor[1] : this.opposite[1],
      w: Math.max(1, Math.abs(w)), // Negative values
      h: Math.max(1, Math.abs(h)) 
    };
  }

  dragTo = (oppositeX, oppositeY) => {
    // Make visible
    this.shape.style.display = null;

    this.opposite = [ oppositeX, oppositeY ];
    const { x, y, w, h } = this.bbox;

    setRectMaskSize(this.mask, x, y, w, h);
    setRectSize(this.rect, x, y, w, h);
  }

  getBoundingClientRect = () => 
    this.rect.getBoundingClientRect();

  toSelection = () => {
    const { x, y, w, h } = this.bbox;
    return new Selection(toRectFragment(x, y, w, h));
  }

  destroy = () => {
    this.shape.parentNode.removeChild(this.shape);

    this.mask = null;
    this.rect = null;
    this.shape = null;
  }

}