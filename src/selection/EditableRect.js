import EventEmitter from 'tiny-emitter';
import { drawRect, getRectSize, setRectSize } from '../annotations/RectFragment';

/**
 * An editable rectangle shape.
 */
export default class EditableRect extends EventEmitter {

  constructor(annotation, svg) {
    super();

    this.annotation = annotation;
    this.svg = svg;

    this.g = drawRect(annotation);
    this.g.setAttribute('class', 'a9s-annotation editable');

    this.g.addEventListener('mousedown', this.onMouseDown);
    this.g.addEventListener('mousemove', this.onMouseMove);
    this.g.addEventListener('mouseup', this.onMouseUp);

    this.svg.appendChild(this.g);

    // Mouse xy offset inside the shape, if mouse pressed
    this.mouseOffset = null;
  }

  /** Converts mouse coordinates to SVG coordinates **/
  getMousePosition = evt => {
    const pt = this.svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    return pt.matrixTransform(this.svg.getScreenCTM().inverse());
  }

  onMouseDown = evt => {
    const pos = this.getMousePosition(evt);
    const { x, y } = getRectSize(this.g);
    this.mouseOffset = { x: pos.x - x, y: pos.y - y };
  }

  onMouseMove = evt => {
    if (this.mouseOffset) {
      const pos = this.getMousePosition(evt);
      const { w, h } = getRectSize(this.g);

      const x = pos.x - this.mouseOffset.x;
      const y = pos.y - this.mouseOffset.y;

      setRectSize(this.g, x, y, w, h);

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