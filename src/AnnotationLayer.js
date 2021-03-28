import EventEmitter from 'tiny-emitter';
import { drawShape, shapeArea } from './selectors';
import { SVG_NAMESPACE, addClass, removeClass } from './util/SVG';
import DrawingTools from './tools/ToolsRegistry';
import { format } from './util/Formatting';
import { getSnippet } from './util/ImageSnippet';
import { isTouchDevice, enableTouch } from './util/Touch';

export default class AnnotationLayer extends EventEmitter {

  constructor(props) {
    super();

    const { wrapperEl, config, env } = props;
    
    this.imageEl = env.image;
    this.readOnly = config.readOnly;
    this.formatter = config.formatter;

    const { naturalWidth, naturalHeight } = this.imageEl;

    // Annotation layer SVG element
    this.svg = document.createElementNS(SVG_NAMESPACE, 'svg');

    if (isTouchDevice()) {
      this.svg.setAttribute('class', 'a9s-annotationlayer touch');
      enableTouch(this.svg);
    } else {
      this.svg.setAttribute('class', 'a9s-annotationlayer');
    }

    if (naturalWidth == 0 && naturalHeight == 0) {
      this.imageEl.onload = () =>
        this.svg.setAttribute('viewBox', `0 0 ${this.imageEl.naturalWidth} ${this.imageEl.naturalHeight}`);
    } else {
      this.svg.setAttribute('viewBox', `0 0 ${naturalWidth} ${naturalHeight}`);
    }

    // Don't attach directly, but in group
    this.g = document.createElementNS(SVG_NAMESPACE, 'g');

    this.svg.appendChild(this.g);
    wrapperEl.appendChild(this.svg);

    // Currently selected shape
    this.selectedShape = null;

    if (this.readOnly) {
      // No drawing, only select the current hover shape
      this.svg.addEventListener('mousedown', this.selectCurrentHover);
    } else {
      // Attach handlers to the drawing tool palette
      this.tools = new DrawingTools(this.g, config, env);
      this.tools.on('cancel', this.selectCurrentHover);
      this.tools.on('complete', shape => {
        this.selectShape(shape);
      });

      // Enable drawing
      if (!this.readOnly)
        this.svg.addEventListener('mousedown', this._onMouseDown);
    }

    this.currentHover = null;
  }

  _attachHoverListener = (elem, annotation) => {
    elem.addEventListener('mouseenter', evt => {
      if (this.currentHover !== elem)
        this.emit('mouseEnterAnnotation', annotation, evt);

      this.currentHover = elem;
    });

    elem.addEventListener('mouseleave', evt => {
      if (this.currentHover === elem) 
        this.emit('mouseLeaveAnnotation', annotation, evt);

      this.currentHover = null;
    });
  }

  _onMouseDown = evt => {
    if (!this.selectedShape && !this.tools.current.isDrawing) {
      // No active selection & not drawing now? Start drawing.
      this.tools.current.start(evt);
    } else if (this.selectedShape !== this.currentHover) {
      // If there is none, select the current hover
      this.selectCurrentHover();
    }
  }

  addAnnotation = annotation => {
    const g = drawShape(annotation);
    
    g.setAttribute('class', 'a9s-annotation');
    format(g, annotation, this.formatter);
    
    g.setAttribute('data-id', annotation.id);
    g.annotation = annotation;
    this._attachHoverListener(g, annotation);
  
    this.g.appendChild(g);
    return g;
  }

  addDrawingTool = plugin =>
    this.tools.registerTool(plugin);

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

  deselect = skipRedraw => {
    if (this.selectedShape) {
      const { annotation } = this.selectedShape;

      if (this.selectedShape.destroy) {
        // Modifiable shape: destroy and re-add the annotation
        this.selectedShape.destroy();
        this.selectedShape = null;

        if (!annotation.isSelection) {
          this.addAnnotation(annotation);
          if (!skipRedraw)
            this.redraw(); 
        }
      } else {
        // Not modifiable - just clear
        removeClass(this.selectedShape, 'selected');
        this.selectedShape = null;
      }
    }
  } 

  destroy = () => {
    this.currentHover = null;
    this.svg.parentNode.removeChild(this.svg);
  }

  /** Finds the shape matching the given annotation or Id **/
  findShape = annotationOrId => {
    const id = annotationOrId?.id ? annotationOrId.id : annotationOrId;
    return this.g.querySelector(`.a9s-annotation[data-id="${id}"]`);
  }

  getAnnotations = () => {
    const shapes = Array.from(this.g.querySelectorAll('.a9s-annotation'));
    return shapes.map(s => s.annotation);
  }

  getSelected = () => {
    if (this.selectedShape) {
      const { annotation } = this.selectedShape;
      const element = this.selectedShape.element || this.selectedShape;
      return { annotation, element };
    }
  }
    
  getSelectedImageSnippet = () => {
    if (this.selectedShape) {
      const element = this.selectedShape.element || this.selectedShape;
      return getSnippet(this.imageEl, element);
    }  
  }

  init = annotations => {
    annotations.sort((a, b) => shapeArea(b) - shapeArea(a));
    annotations.forEach(this.addAnnotation);
  }

  listDrawingTools = () =>
    this.tools.listTools();

  /** 
   * Forces a new ID on the annotation with the given ID. 
   * @returns the updated annotation for convenience
   */
  overrideId = (originalId, forcedId) => {
    // Update SVG shape data attribute
    const shape = this.findShape(originalId);
    shape.setAttribute('data-id', forcedId);

    // Update annotation
    const { annotation } = shape;

    const updated = annotation.clone({ id : forcedId });
    shape.annotation = updated;

    return updated;
  }

  /**
   * Redraws the whole layer with annotations sorted by
   * size, so that larger ones don't occlude smaller ones.
   */
  redraw = () => {
    const shapes = Array.from(this.g.querySelectorAll('.a9s-annotation'));

    const annotations = shapes.map(s => s.annotation);
    annotations.sort((a, b) => shapeArea(b) - shapeArea(a));

    // Clear the SVG element
    shapes.forEach(s => this.g.removeChild(s));

    // Redraw
    annotations.forEach(this.addAnnotation);
  }

  removeAnnotation = annotationOrId => {
    // Removal won't work if the annotation is currently selected - deselect!
    const id = annotationOrId.type ? annotationOrId.id : annotationOrId;

    if (this.selectedShape?.annotation.id === id)
      this.deselect();

    const toRemove = this.findShape(annotationOrId);

    if (toRemove) {
      if (this.selectedShape?.annotation === toRemove.annotation)
        this.deselect();

      if (this.currentHover?.annotation === toRemove.annotation)
        this.currentHover = null;

      toRemove.parentNode.removeChild(toRemove);
    }
  }

  /** 
   * Programmatic selection via the API. Should work as normal,
   * but the selectAnnotation event should not be fired to the outside.
   */
  selectAnnotation = (annotationOrId, skipEvent) => {
    // Deselect first
    if (this.selectedShape)
      this.deselect();

    const selected = this.findShape(annotationOrId);

    if (selected) {
      this.selectShape(selected, skipEvent);

      const element = this.selectedShape.element ? 
        this.selectedShape.element : this.selectedShape;
      
      return { annotation: selected.annotation, element };
    } else {
      this.deselect();
    }
  }

  selectCurrentHover = () => {
    if (this.currentHover) {
      this.selectShape(this.currentHover);
    } else {
      this.deselect();
      this.emit('select', { skipEvent: true });
    }
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

    if (!readOnly) {
      // Replace the shape with an editable version
      shape.parentNode.removeChild(shape);

      const toolForAnnotation = this.tools.forAnnotation(annotation);      
      this.selectedShape = toolForAnnotation.createEditableShape(annotation);

      // Yikes... hack to make the tool act like SVG annotation shapes - needs redesign
      this.selectedShape.element.annotation = annotation;         
      this._attachHoverListener(this.selectedShape.element, annotation);

      this.selectedShape.on('update', fragment => {
        this.emit('updateTarget', this.selectedShape.element, fragment);
      });

      if (!skipEvent)
        this.emit('select', { annotation, element: this.selectedShape.element });
    } else {
      addClass(shape, 'selected');
      this.selectedShape = shape;
      this.emit('select', { annotation, element: shape, skipEvent }); 
    }
  }

  setDrawingTool = shape =>
    this.tools.setCurrent(shape);

  setVisible = visible => {
    if (visible)
      this.svg.style.display = null;
    else
      this.svg.style.display = 'none';
  }

}
