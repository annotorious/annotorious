import EventEmitter from 'tiny-emitter';
import { drawRect, rectArea } from './RectFragment';
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

  onDrawingCanceled = () => {
    if (this.currentHover) {
      this.emit('select', { 
        selection: this.currentHover.annotation,
        bounds: this.currentHover.getBoundingClientRect()
      });
    }
  }

  _addAnnotation = annotation => {
    const g = drawRect(annotation);  
    g.setAttribute('class', 'a9s-annotation');
    g.setAttribute('data-id', annotation.id);
    g.annotation = annotation;
  
    this.svg.appendChild(g);
 
    g.addEventListener('mouseenter', () => 
      this.currentHover = g);

    g.addEventListener('mouseleave', () =>  
      this.currentHover = null);

    return g;
  }

  _findShape = annotation =>
    this.svg.querySelector(`.a9s-annotation[data-id="${annotation.id}"]`);

  init = annotations => {
    // Sort annotations by size
    annotations.sort((a, b) => rectArea(b) - rectArea(a));
    annotations.forEach(this._addAnnotation);
  }

  addOrUpdateAnnotation = (annotation, previous) => {
    if (previous)
      this.removeAnnotation(annotation);

    this._addAnnotation(annotation);

    // Make sure rendering order is large-to-small
    this.redraw();
  }

  removeAnnotation = annotation => {
    const shape = this._findShape(annotation);
    if (shape)
      shape.parentNode.removeChild(shape);
  }

  getAnnotations = () => {
    const shapes = Array.from(this.svg.querySelectorAll('.a9s-annotation'));
    return shapes.map(s => s.annotation);
  }

  /**
   * Redraws the whole layer with annotations sorted by
   * size, so that larger ones don't occlude smaller ones.
   */
  redraw = () => {
    const shapes = Array.from(this.svg.querySelectorAll('.a9s-annotation'));
    const annotations = shapes.map(s => s.annotation);
    annotations.sort((a, b) => rectArea(b) - rectArea(a));

    // Clear the SVG element
    shapes.forEach(s => this.svg.removeChild(s));

    // Redraw
    annotations.forEach(this._addAnnotation);
  }

  clearSelection = () =>
    this.currentTool.clear();

}