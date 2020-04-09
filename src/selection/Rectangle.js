import { SVG_NAMESPACE } from '../SVGConst';
import { Selection } from '@recogito/recogito-client-core';

export class Rectangle {
  
  constructor(x, y, w, h) {
    this.g = document.createElementNS(SVG_NAMESPACE, 'g');

    this.outerRect  = document.createElementNS(SVG_NAMESPACE, 'rect');
    this.innerRect  = document.createElementNS(SVG_NAMESPACE, 'rect');

    this.innerRect.setAttribute('class', 'inner');
    this.innerRect.setAttribute('x', x + 0.5);
    this.innerRect.setAttribute('y', y + 0.5);
    this.innerRect.setAttribute('width', w - 1);
    this.innerRect.setAttribute('height',  h - 1);
  
    this.outerRect.setAttribute('class', 'outer');
    this.outerRect.setAttribute('x', x - 0.5);
    this.outerRect.setAttribute('y', y - 0.5);
    this.outerRect.setAttribute('width', w + 1);
    this.outerRect.setAttribute('height',  h + 1);
  
    this.g.appendChild(this.outerRect);
    this.g.appendChild(this.innerRect);
  }

  get svg() {
    return this.g;
  }

  setAttribute = (key, val) =>
    this.g.setAttribute(key, val);

  addEventListener = (event, handler) =>
    this.g.addEventListener(event, handler);

  removeEventListener = (event, handler) =>
    this.g.removeEventListener(event, handler);

  set x(x) {
    this.innerRect.setAttribute('x', x + 0.5);
    this.outerRect.setAttribute('x', x - 0.5);
  } 
  
  set y(y) {
    this.innerRect.setAttribute('y', y + 0.5);
    this.outerRect.setAttribute('y', y - 0.5);
  } 

  set width(w) {
    this.innerRect.setAttribute('width', w - 1);
    this.outerRect.setAttribute('width', w + 1);
  } 

  set height(h) {
    this.innerRect.setAttribute('height', h - 1);
    this.outerRect.setAttribute('height', h + 1);
  }

  destroy = () =>
    this.g.parentNode.removeChild(this.g);

}

export class DraggableRect {

  constructor(anchorXY, svg) {
    this.anchor = anchorXY;
    this.opposite = [ anchorXY[0] + 2, anchorXY[1] + 2];

    this.shape = new Rectangle(anchorXY[0], anchorXY[1], 2, 2);

    svg.appendChild(this.shape.svg);
  }

  get bbox() {
    const w = this.opposite[0] - this.anchor[0];
    const h = this.opposite[1] - this.anchor[1];

    return {
      x: w > 0 ? this.anchor[0] : this.opposite[0],
      y: h > 0 ? this.anchor[1] : this.opposite[1],
      w: Math.abs(w),
      h: Math.abs(h)
    };
  }

  dragTo = (oppositeX, oppositeY) => {
    this.opposite = [ oppositeX, oppositeY ];

    const { x, y, w, h } = this.bbox;

    this.shape.x = x;
    this.shape.y = y;
    this.shape.width = w;
    this.shape.height = h;
  }

  destroy = () =>
    this.shape.destroy();

  get svg() { 
    return this.shape.svg;
  }

  toSelection = () => {
    const { x, y, w, h } = this.bbox;
    console.log(this.bbox);
    return new Selection([{
      "type": "FragmentSelector",
      "conformsTo": "http://www.w3.org/TR/media-frags/",
      "value": `xywh=pixel:${x},${y},${w},${h}`
    }]);
  }

}