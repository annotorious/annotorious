import EventEmitter from 'tiny-emitter';
import { drawRect, rectArea, toRectFragment } from './RectFragment';
import { SVG_NAMESPACE } from '../SVGConst';
import EditableRect from '../selection/EditableRect';
import RubberbandRectSelector from '../selection/RubberbandRectSelector';

export default class AnnotationLayer extends EventEmitter {

  constructor(wrapperEl, readOnly) {
    super();

    this.readOnly = readOnly;

    // Annotation layer SVG element
    this.svg = document.createElementNS(SVG_NAMESPACE, 'svg');
    this.svg.classList.add('a9s-annotationlayer');
    wrapperEl.appendChild(this.svg);

    // Currently open annotation
    this.selectedShape = null;

    if (readOnly) {
      // TODO alternative mouseDown handler - just select current hover
    } else {
      // TODO make switchable in the future
      const selector = new RubberbandRectSelector(this.svg);
      selector.on('complete', this.selectShape);
      selector.on('cancel', this.onDrawingCanceled);

      this.currentTool = selector;

      this.enableDrawing();
    }

    this.currentHover = null;
  }

  enableDrawing = () =>
    this.svg.addEventListener('mousedown', this.startDrawing);

  disableDrawing = () =>
    this.svg.removeEventListener('mousedown', this.startDrawing);

  startDrawing = evt =>
    this.currentTool.startDrawing(evt);

  onDrawingCanceled = () => {
    if (this.currentHover)
      this.selectShape(this.currentHover);
  }

  addAnnotation = annotation => {
    const g = drawRect(annotation);  
    g.setAttribute('class', 'a9s-annotation');
    g.setAttribute('data-id', annotation.id);
    g.annotation = annotation;
  
    this.svg.appendChild(g);
 
    g.addEventListener('mouseenter', evt => {
      if (this.currentHover !== g)
        this.emit('mouseEnterAnnotation', annotation, evt);
        
      this.currentHover = g;
    });

    g.addEventListener('mouseleave', evt => {
      if (this.currentHover === g) 
        this.emit('mouseLeaveAnnotation', annotation, evt);

      this.currentHover = null;
    });

    return g;
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
    annotations.forEach(this.addAnnotation);
  }

  /** Finds the shape matching the given annotation or Id **/
  findShape = annotationOrId => {
    const id = annotationOrId.id ? annotationOrId.id : annotationOrId;
    return this.svg.querySelector(`.a9s-annotation[data-id="${id}"]`);
  }

  /** 
   * Selection always requires annotation + shape. 
   * The annotation is always a member of the shape.
   * If we only have the annotation, we need to find
   * the matching shape first.
   */
  selectAnnotation = annotationOrId => {
    const selected = this.findShape(annotationOrId);
    if (selected)
      this.selectShape(selected);
  }

  selectShape = shape => {
    const { annotation } = shape;
    const bounds = shape.getBoundingClientRect();

    if (!this.readOnly) {
      // No drawing while editing an existing annotation
      this.disableDrawing(); 

      // Replace the shape with an editable version
      shape.parentNode.removeChild(shape);

      this.selectedShape = new EditableRect(annotation, this.svg);
      this.selectedShape.on('update', xywh => {
        const bounds = this.selectedShape.getBoundingClientRect();
        const { x, y, w, h } = xywh;
        this.emit('updateBounds', bounds, toRectFragment(x, y, w, h));
      });
    }

    this.emit('select', { annotation, bounds }); 
  }
  
  deselect = () => {
    if (this.selectedShape) {
      this.addAnnotation(this.selectedShape.annotation);
      this.selectedShape.destroy();
      this.selectedShape = null;
    }
    
    this.enableDrawing();
  } 

  init = annotations => {
    // Sort annotations by size
    annotations.sort((a, b) => rectArea(b) - rectArea(a));
    annotations.forEach(this.addAnnotation);
  }

  addOrUpdateAnnotation = (annotation, previous) => {
    if (previous)
      this.removeAnnotation(annotation);

    this.addAnnotation(annotation);

    // Make sure rendering order is large-to-small
    this.redraw();
  }

  removeAnnotation = annotation => {
    const shape = this.findShape(annotation);
    if (shape)
      shape.parentNode.removeChild(shape);
  }

  getAnnotations = () => {
    const shapes = Array.from(this.svg.querySelectorAll('.a9s-annotation'));
    return shapes.map(s => s.annotation);
  }

  setAnnotationsVisible = visible => {
    if (visible)
      this.svg.style.display = null;
    else
      this.svg.style.display = 'none';
  }

  destroy = () => {
    this.currentTool = null;
    this.currentHover = null;
    this.svg.parentNode.removeChild(this.svg);
  }

}