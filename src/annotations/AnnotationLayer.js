import EventEmitter from 'tiny-emitter';
import { drawRect, rectArea, toRectFragment } from './RectFragment';
import { SVG_NAMESPACE } from '../SVGConst';
import EditableRect from '../selection/EditableRect';
import RubberbandRectSelector from '../selection/RubberbandRectSelector';

export default class AnnotationLayer extends EventEmitter {

  constructor(props) {
    super();

    const { wrapperEl, imageEl, readOnly, headless } = props;

    this.readOnly = readOnly;
    this.headless = headless;

    const { naturalWidth, naturalHeight } = imageEl;

    // Annotation layer SVG element
    this.svg = document.createElementNS(SVG_NAMESPACE, 'svg');
    this.svg.classList.add('a9s-annotationlayer');

    if (naturalWidth == 0 && naturalHeight == 0) {
      imageEl.onload = () =>
        this.svg.setAttribute('viewBox', `0 0 ${imageEl.naturalWidth} ${imageEl.naturalHeight}`);
    } else {
      this.svg.setAttribute('viewBox', `0 0 ${naturalWidth} ${naturalHeight}`);
    }

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
  enableSelectHover = () =>
    this.svg.addEventListener('mousedown', this.selectCurrentHover);

  /** Disables selection of shape under the mouse **/
  disableSelectHover = () =>
    this.svg.removeEventListener('mousedown', this.selectCurrentHover);

  startDrawing = evt =>
    this.currentTool.startDrawing(evt);

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
    const id = annotationOrId?.id ? annotationOrId.id : annotationOrId;
    return this.g.querySelector(`.a9s-annotation[data-id="${id}"]`);
  }

  /** 
   * Programmatic selection via the API. Should work as normal,
   * but the selectAnnotation event should not be fired to the outside.
   */
  selectAnnotation = annotationOrId => {
    // Deselect first
    if (this.selectedShape)
      this.deselect();

    const selected = this.findShape(annotationOrId);

    // Select with 'skipEvent' flag
    if (selected)
      this.selectShape(selected, true);
    else
      this.deselect();

    return selected?.annotation;
  }

  selectShape = (shape, skipEvent) => {
    // Don't re-select
    if (this.selectedShape?.annotation === shape?.annotation)
      return;
    
    // If another shape is currently selected, deselect first
    if (this.selectedShape && this.selectedShape.annotation !== shape.annotation) {
      this.deselect(true);
    }

    const { annotation } = shape;

    const readOnly = this.readOnly || annotation.readOnly;

    if (!(readOnly || this.headless)) {
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

      // Don't fire select event if selection was made programmatically
      this.emit('select', { annotation, element: this.selectedShape.element, skipEvent }); 
    } else {
      this.emit('select', { annotation, element: shape, skipEvent }); 
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
    if (this.selectedShape?.annotation === annotation || this.selectShape?.annotation == previous)
      this.deselect();
  
    if (previous)
      this.removeAnnotation(previous);
    
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

  setVisible = visible => {
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