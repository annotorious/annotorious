import EventEmitter from 'tiny-emitter';
import { drawRect } from './RectFragment';
import { RectDragSelector } from '../selection/RectDragSelector';
import { SVG_NAMESPACE } from '../SVGConst';

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

  onDrawingComplete = evt =>
    this.emit('select', evt);

  onDrawingCanceled = () =>
    this.emit('select', { 
      selection: this.currentHover.annotation,
      bounds: this.currentHover.getBoundingClientRect()
    });

  _addAnnotation = annotation => {
    const g = drawRect(annotation);  
    g.setAttribute('class', 'a9s-annotation');
    g.setAttribute('data-id', annotation.id);
    g.annotation = annotation;
  
    this.svg.appendChild(g);
 
    g.addEventListener('mouseover', evt => this.currentHover = g);
    return g;
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