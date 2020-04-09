import EventEmitter from 'tiny-emitter';
import { Rectangle } from '../selection/Rectangle';
import { RectDragSelector } from '../selection/RectDragSelector';
import { SVG_NAMESPACE } from '../SVGConst';
import { parseFragment } from './AnnotationUtils';

import './AnnotationLayer.scss';


export default class AnnotationLayer extends EventEmitter {

  constructor(wrapperEl) {
    super();

    this.svg = document.createElementNS(SVG_NAMESPACE, 'svg');
    this.svg.classList.add('a9s-annotationlayer');

    wrapperEl.appendChild(this.svg);

    this.svg.addEventListener('mousedown', this.onMouseDown);

    // TODO make switchable in the future
    const selector = new RectDragSelector(this.svg);
    selector.on('complete', this.onDrawingComplete);
    selector.on('cancel', this.onDrawingCanceled);

    this.currentTool = selector;
    this.currentHover = null;
  }

  onMouseDown = evt =>
    this.currentTool.startDrawing(evt);

  onDrawingComplete = evt => {
    console.log(evt);
    this.emit('select', evt);
  }

  onDrawingCanceled = evt => {
    console.log(this.currentHover);
    this.emit('select', { 
      selection: this.currentHover.annotation,
      bounds: this.currentHover.getBoundingClientRect()
    });
  }

  _addAnnotation = annotation => {
    // TODO revise the event object in shape, and just pass the event on here
    const { x, y, w, h } = parseFragment(annotation);
    const shape = new Rectangle(x, y, w, h);

    shape.setAttribute('class', 'a9s-annotation');
    shape.setAttribute('data-id', annotation.id);
    shape.svg.annotation = annotation;

    this.svg.appendChild(shape.svg);

    shape.addEventListener('mouseover', evt => {
      this.currentHover = evt.target.parentNode;
    });
  }

  _findShape = annotation =>
    document.querySelector(`.a9s-annotation[data-id="${annotation.id}"]`);

  init = annotations =>
    annotations.forEach(this._addAnnotation);

  addOrUpdateAnnotation = (annotation, previous) => {
    if (previous)
      this.removeAnnotation(annotation);

    this._addAnnotation(annotation);
  }

  removeAnnotation = annotation => {
    const shape = this._findShape(annotation);
    if (shape)
      shape.parentNode.removeChild(shape);
  }

  clearSelection = () =>
    this.currentTool.clear();

}