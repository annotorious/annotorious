import EventEmitter from 'tiny-emitter';
import { drawRect, getRectSize, setRectSize, parseRectFragment } from '../annotations/RectFragment';
import { SVG_NAMESPACE } from '../SVGConst';

const drawHandle = (x, y, className) => {
  const rect  = document.createElementNS(SVG_NAMESPACE, 'rect'); 
  
  rect.setAttribute('x', x - 4);
  rect.setAttribute('y', y - 4);
  rect.setAttribute('width', 8);
  rect.setAttribute('height', 8);
  rect.setAttribute('class', `resize-handle ${className}`);

  return rect;
}

const setHandleXY = (handle, x, y) => {
  handle.setAttribute('x', x - 4);
  handle.setAttribute('y', y - 4);
}

/**
 * An editable rectangle shape.
 */
export default class EditableRect extends EventEmitter {

  constructor(annotation, svg) {
    super();

    this.annotation = annotation;
    this.svg = svg;

    const { x, y, w, h } = parseRectFragment(annotation);

    this.g = drawRect(x, y, w, h);
    this.g.setAttribute('class', 'a9s-annotation editable');

    this.g.addEventListener('mousedown', this.onGrabRect);
    this.svg.addEventListener('mousemove', this.onMouseMove);
    this.svg.addEventListener('mouseup', this.onMouseUp);

    this.handles = [
      [ x,     y,     'topleft' ], 
      [ x + w, y,     'topright'], 
      [ x + w, y + h, 'bottomright' ], 
      [ x,     y + h, 'bottomleft' ]
    ].map(t => { 
      const [ x, y, className ] = t;
      const handle = drawHandle(x, y, className);

      handle.addEventListener('mousedown', this.onGrabHandle);
      this.g.appendChild(handle);

      return handle;
    });

    this.svg.appendChild(this.g);

    // Mouse xy offset inside the shape, if mouse pressed
    this.mouseOffset = null;
  }

  /** Sets the shape size, including handle positions **/
  setSize = (x, y, w, h) => {
    setRectSize(this.g, x, y, w, h);

    const [ topleft, topright, bottomright, bottomleft] = this.handles;
    setHandleXY(topleft, x, y);
    setHandleXY(topright, x + w, y);
    setHandleXY(bottomright, x + w, y + h);
    setHandleXY(bottomleft, x, y + h);
  }

  /** Converts mouse coordinates to SVG coordinates **/
  getMousePosition = evt => {
    const pt = this.svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    return pt.matrixTransform(this.svg.getScreenCTM().inverse());
  }

  onGrabRect = evt => {
    const pos = this.getMousePosition(evt);
    const { x, y } = getRectSize(this.g);
    this.mouseOffset = { x: pos.x - x, y: pos.y - y };
  }

  onGrabHandle = evt => {
    // 
  }

  onMouseMove = evt => {
    if (this.mouseOffset) {
      const pos = this.getMousePosition(evt);
      const { w, h } = getRectSize(this.g);

      const x = pos.x - this.mouseOffset.x;
      const y = pos.y - this.mouseOffset.y;

      this.setSize(x, y, w, h);

      this.emit('update', { x, y, w, h });
    }
  }

  onMouseUp = evt =>
    this.mouseOffset = null;

  getBoundingClientRect = () => 
    this.g.getBoundingClientRect();

  destroy = () =>
    this.g.parentNode.removeChild(this.g);

}