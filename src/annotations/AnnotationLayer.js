import EventEmitter from 'tiny-emitter';
import { drawRect, rectArea, toRectFragment } from './RectFragment';
import { SVG_NAMESPACE } from '../SVGConst';
import EditableRect from '../selection/EditableRect';
import RubberbandRectSelector from '../selection/RubberbandRectSelector';

export default class AnnotationLayer extends EventEmitter {

  constructor(props) {
    super();

    const { wrapperEl, imageEl, readOnly, headless } = props;

    this.imageSrc = imageEl.src;
    this.readOnly = readOnly;
    this.headless = headless;

    const { naturalWidth, naturalHeight } = props.imageEl;

    // Annotation layer SVG element
    this.svg = document.createElementNS(SVG_NAMESPACE, 'svg');
    this.svg.setAttribute('viewBox', `0 0 ${naturalWidth} ${naturalHeight}`);
    this.svg.classList.add('a9s-annotationlayer');

    // Don't attach directly, but in group
    this.g = document.createElementNS(SVG_NAMESPACE, 'g');
    this.svg.appendChild(this.g);
    wrapperEl.appendChild(this.svg);

    // Currently open annotation
    this.selectedShape = null;

    if (readOnly) {
      // No drawing, only select the current hover shape
      this.enableSelectHover();
    } else {
      // TODO make switchable in the future
      const selector = new RubberbandRectSelector(this.g);
      selector.on('complete', this.selectShape);
      selector.on('cancel', this.selectCurrentHover);

      this.currentTool = selector;

      this.enableDrawing();
    }

    this.currentHover = null;
  }

  /** Enables drawing (and disables selection of hover shape) **/
  enableDrawing = () => {
    if (!this.readOnly) {
      this.disableSelectHover();
      this.svg.addEventListener('mousedown', this.startDrawing);
    }
  }

  /** Disables drawing (and enables selection of hover shape) **/
  disableDrawing = () => {
    this.svg.removeEventListener('mousedown', this.startDrawing);
    this.enableSelectHover();
  }

  /** Enables selection of shape under the mouse **/
  enableSelectHover = () => {
    this.svg.addEventListener('mousedown', this.selectCurrentHover);
  }

  /** Disables selection of shape under the mouse **/
  disableSelectHover = () => {
    this.svg.removeEventListener('mousedown', this.selectCurrentHover);
  }

  startDrawing = evt => {
    this.currentTool.startDrawing(evt);
  }

  selectCurrentHover = () => {
    if (this.currentHover)
      this.selectShape(this.currentHover);
  }

  addAnnotation = annotation => {
    const g = drawRect(annotation);  
    g.setAttribute('class', 'a9s-annotation');
    g.setAttribute('data-id', annotation.id);
    g.annotation = annotation;
  
    this.g.appendChild(g);
 
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
    const shapes = Array.from(this.g.querySelectorAll('.a9s-annotation'));

    const annotations = shapes.map(s => s.annotation);
    annotations.sort((a, b) => rectArea(b) - rectArea(a));

    // Clear the SVG element
    shapes.forEach(s => this.g.removeChild(s));

    // Redraw
    annotations.forEach(this.addAnnotation);
  }

  /** Finds the shape matching the given annotation or Id **/
  findShape = annotationOrId => {
    const id = annotationOrId.id ? annotationOrId.id : annotationOrId;
    return this.g.querySelector(`.a9s-annotation[data-id="${id}"]`);
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
    // Don't re-select
    if (this.selectedShape?.annotation === shape?.annotation)
      return;
    
    // If another shape is currently selected, deselect first
    if (this.selectedShape && this.selectedShape.annotation !== shape.annotation) {
      this.deselect(true);
    }

    const { annotation } = shape;

    if (!(this.readOnly || this.headless)) {
      this.disableDrawing();

      if (shape.annotation.isSelection)
        this.disableSelectHover();

      // Replace the shape with an editable version
      shape.parentNode.removeChild(shape);

      this.selectedShape = new EditableRect(annotation, this.g);
      this.selectedShape.on('update', xywh => {
        const { x, y, w, h } = xywh;
        this.emit('updateTarget', this.selectedShape.element, toRectFragment(x, y, w, h));
      });

      this.emit('select', { annotation, element: this.selectedShape.element }); 
    } else {
      this.emit('select', { annotation, element: shape }); 
    }

  }
  
  deselect = skipRedraw => {
    if (this.selectedShape) {
      const { annotation } = this.selectedShape;

      this.selectedShape.destroy();
      this.selectedShape = null;

      if (!annotation.isSelection) {
        this.addAnnotation(annotation);
        if (!skipRedraw)
          this.redraw(); 
      }
    }

    this.enableDrawing();
  } 

  init = annotations => {
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
    if (this.selectedShape?.annotation === annotation)
      this.deselect();

    const shape = this.findShape(annotation);
    if (shape)
      shape.parentNode.removeChild(shape);
  }

  getAnnotations = () => {
    const shapes = Array.from(this.g.querySelectorAll('.a9s-annotation'));
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
    
    this.resizeObserver.disconnect();
    this.resizeObserver = null;
  }

}