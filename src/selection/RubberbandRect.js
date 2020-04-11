import { Selection } from '@recogito/recogito-client-core';
import { drawRect, setRectSize } from '../annotations/RectFragment';

export default class RubberbandRect {

  constructor(anchorX, anchorY, svg) {
    this.anchor = [ anchorX, anchorY ];
    this.opposite = [ anchorX + 2, anchorY + 2];

    this.shape = drawRect(anchorX, anchorY, 2, 2);
    this.shape.setAttribute('class', 'a9s-selection');

    // We make this shape transparent to pointer events
    // because it would interfere with the rendered 
    // annotations' mouseleave/enter events
    this.shape.style.pointerEvents = 'none';

    svg.appendChild(this.shape);
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
    this.opposite = [ oppositeX, oppositeY ];
    const { x, y, w, h } = this.bbox;
    setRectSize(this.shape, x, y, w, h);
  }

  destroy = () => {
    this.shape.parentNode.removeChild(this.shape);
    this.shape = null;
  }

  getBoundingClientRect = () => 
    this.shape.getBoundingClientRect();

  toSelection = () => {
    const { x, y, w, h } = this.bbox;
    return new Selection([{
      "type": "FragmentSelector",
      "conformsTo": "http://www.w3.org/TR/media-frags/",
      "value": `xywh=pixel:${x},${y},${w},${h}`
    }]);
  }

}