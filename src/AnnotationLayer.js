import EventEmitter from 'tiny-emitter';
import { drawShape, shapeArea } from './selectors';
import { SVG_NAMESPACE, addClass, removeClass } from './util/SVG';
import DrawingTools from './tools/DrawingTools';
import { format } from './util/Formatting';
import { getSnippet } from './util/ImageSnippet';

export default class AnnotationLayer extends EventEmitter {

  constructor(props) {
    super();

    const { wrapperEl, config, env } = props;
    console.log('env', env);
    
    this.imageEl = env.image;
    this.readOnly = config.readOnly;
    this.headless = config.headless;
    this.formatter = config.formatter;

    const { naturalWidth, naturalHeight } = this.imageEl;

    // Annotation layer SVG element
    this.svg = document.createElementNS(SVG_NAMESPACE, 'svg');
    this.svg.setAttribute('class', 'a9s-annotationlayer');

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
        this.emit('createSelection', shape.annotation);
      });

      // Enable drawing
      if (!this.readOnly)
        this.svg.addEventListener('mousedown', this.startDrawing);
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

  removeAnnotation = annotation => {
    if (this.selectedShape?.annotation === annotation)
      this.deselect();

    if (this.currentHover?.annotation === annotation)
      this.currentHover = null;

    const shape = this.findShape(annotation);
    if (shape)
      shape.parentNode.removeChild(shape);
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
      const toolForShape = this.tools.forShape(shape);

      if (toolForShape?.supportsModify) {
        // Replace the shape with an editable version
        shape.parentNode.removeChild(shape);

        this.selectedShape = toolForShape.createEditableShape(annotation);

        // Yikes... hack to make the tool act like SVG annotation shapes - needs redesign
        this.selectedShape.element.annotation = annotation;         
        this._attachHoverListener(this.selectedShape.element, annotation);

        this.selectedShape.on('update', fragment => {
          this.emit('updateTarget', this.selectedShape.element, fragment);
        });

        this.emit('select', { annotation, element: this.selectedShape.element, skipEvent });
      } else {
        addClass(shape, 'selected');
        this.selectedShape = shape;
        this.emit('select', { annotation, element: shape, skipEvent });  
      }
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

  startDrawing = evt => {
    if (!this.selectedShape) {
      // Only start drawing if there's no active selection
      this.tools.current.startDrawing(evt);
    } else if (this.selectedShape !== this.currentHover) {
      // If there is none, select the current hover
      this.selectCurrentHover();
    }
  }

}
