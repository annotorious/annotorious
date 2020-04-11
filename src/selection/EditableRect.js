import EventEmitter from 'tiny-emitter';
import { drawRect, getRectSize, setRectSize } from '../annotations/RectFragment';

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
  }

  getMousePosition = evt => {
    const ctm = this.svg.getScreenCTM();
    return {
      x: (evt.clientX - ctm.e) / ctm.a,
      y: (evt.clientY - ctm.f) / ctm.d
    };
  }

  onMouseDown = evt => {
    // xy offset of the mouse inside the shape
    this.offset = this.getMousePosition(evt);

    const { x, y } = getRectSize(this.g);
    this.offset.x -= x;
    this.offset.y -= y;
  }

  onMouseMove = evt => {
    // Hack
    if (this.offset) {
      const coord = this.getMousePosition(evt);
      const { w, h } = getRectSize(this.g);

      const x = coord.x - this.offset.x;
      const y = coord.y - this.offset.y;

      setRectSize(this.g, x, y, w, h);

      this.emit('update', { x, y, w, h });
    }
  }

  onMouseUp = evt => {
    // Hack
    this.offset = null;
  }

  getBoundingClientRect = () => 
    this.g.getBoundingClientRect();

  get xywh() {
    return getRectSize(this.g);
  }

  destroy = () => {
    this.g.parentNode.removeChild(this.g);
  }

}