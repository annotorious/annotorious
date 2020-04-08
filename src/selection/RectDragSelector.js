import EventEmitter from 'tiny-emitter';
import { parseFragment } from '../annotations/AnnotationUtils';
import { SVG_NAMESPACE } from '../SVGConst';

import './RectDragSelector.scss';

/** Renders an SVG rectangle shape **/
const drawRect = (x, y, w, h) => {
  const g = document.createElementNS(SVG_NAMESPACE, 'g');

  const outerRect  = document.createElementNS(SVG_NAMESPACE, 'rect');
  const innerRect  = document.createElementNS(SVG_NAMESPACE, 'rect');

  innerRect.setAttribute('class', 'inner');
  innerRect.setAttribute('x', x + 0.5);
  innerRect.setAttribute('y', y + 0.5);
  innerRect.setAttribute('width', w - 1);
  innerRect.setAttribute('height',  h - 1);

  outerRect.setAttribute('class', 'outer');
  outerRect.setAttribute('x', x - 0.5);
  outerRect.setAttribute('y', y - 0.5);
  outerRect.setAttribute('width', w + 1);
  outerRect.setAttribute('height',  h + 1);

  g.appendChild(outerRect);
  g.appendChild(innerRect);

  return g;
}

export class Rectangle extends EventEmitter {

  constructor(annotation, svg) {
    super();  

    const fragment = parseFragment(annotation);
    const { x, y, w, h } =  fragment;

    const g = drawRect(x, y, w, h);
    g.setAttribute('class', 'a9s-annotation');
    g.setAttribute('data-id', annotation.id);
    g.annotation = annotation;
  
    svg.appendChild(g);

    const bounds = g.getBoundingClientRect();

    g.addEventListener('click', () => this.emit('click', { bounds }));
  }

}

export class RectDragSelector extends EventEmitter {

  constructor(svg) {
    super();

    this.svg = svg;
    this.shape = null;
  }

  _attachListeners = () => {
    this.svg.addEventListener('mousemove', this.onMouseMove);
    this.svg.addEventListener('mouseup', this.onMouseUp);
  }

  _detachListeners = () => {
    this.svg.removeEventListener('mousemove', this.onMouseMove);
    this.svg.removeEventListener('mouseup', this.onMouseUp);
  }

  startDrawing = evt => {
    this._attachListeners();

    this.shape = drawRect(evt.offsetX, evt.offsetY, 2, 2);
    this.svg.appendChild(this.shape);
  }

  // TODO make this work in all four quadrants
  onMouseMove = evt => {
    // This could be cached (but probably doesn't make much of a difference)
    const outer = this.shape.querySelector('.outer');
    const inner = this.shape.querySelector('.inner');

    const width = evt.offsetX - outer.getAttribute('x');
    const height = evt.offsetY - outer.getAttribute('y');

    inner.setAttribute('width', width - 1);
    inner.setAttribute('height', height - 1);

    outer.setAttribute('width', width + 1);
    outer.setAttribute('height', height + 1);
  }

  // TODO handle mouseup outside of layer
  onMouseUp = evt => {
    this._detachListeners();
    this.emit('complete'); // TODO construct selection object
    this.svg.removeChild(this.shape);
    this.shape = null;
  }

}