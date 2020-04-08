import EventEmitter from 'tiny-emitter';
import { Rectangle } from '../selection/RectDragSelector';
import { SVG_NAMESPACE } from '../SVGConst';

import './AnnotationLayer.scss';

export default class AnnotationLayer extends EventEmitter {

  constructor(wrapperEl) {
    super();

    this.svg = document.createElementNS(SVG_NAMESPACE, 'svg');
    this.svg.classList.add('a9s-annotationlayer');

    wrapperEl.appendChild(this.svg);
  }

  _addAnnotation = annotation => {
    // TODO revise the event object in shape, and just pass the event on here
    const shape = new Rectangle(annotation, this.svg);
    shape.on('click', evt => this.emit('select', { 
      selection: annotation,
      bounds: evt.bounds
    }));
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

}