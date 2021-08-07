import EventEmitter from 'tiny-emitter';
import { drawShape, shapeArea } from './selectors';
import { SVG_NAMESPACE, addClass, removeClass } from './util/SVG';
import DrawingTools from './tools/ToolsRegistry';
import Crosshair from './Crosshair';
import { format } from './util/Formatting';
import { getSnippet } from './util/ImageSnippet';
import { isTouchDevice, enableTouchTranslation } from './util/Touch';

const isTouch = isTouchDevice();

export default class AnnotationLayer extends EventEmitter {

  constructor(props) {
    super();

    const { wrapperEl, config, env } = props;

    this.imageEl = env.image;

    this.readOnly = config.readOnly;
    this.formatter = config.formatter;

    this.disableSelect = false;

    const { naturalWidth, naturalHeight } = this.imageEl;

    // Annotation layer SVG element
    this.svg = document.createElementNS(SVG_NAMESPACE, 'svg');

    if (isTouch) {
      this.svg.setAttribute('class', 'a9s-annotationlayer touch');

      // Translates touch events to simulated mouse events
      enableTouchTranslation(this.svg);

      // Adds additional logic because touch doesn't have hover
      this.svg.addEventListener('touchstart', () => {
        this.currentHover = null;
        this.selectCurrentHover();
      });
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

    if (config.crosshair) {
      this.crosshair = new Crosshair(this.g, naturalWidth, naturalHeight);
      addClass(this.svg, 'has-crosshair');
    }

    // Currently selected shape
    this.selectedShape = null;

    // Init the drawing tools
    this.tools = new DrawingTools(this.g, config, env);
    this.tools.on('startSelection', pt => this.emit('startSelection', pt));
    this.tools.on('cancel', this.selectCurrentHover);
    this.tools.on('complete', this.selectShape);

    this.svg.addEventListener('mousedown', this._onMouseDown);

    this.currentHover = null;
  }

  _attachMouseListeners = (elem, annotation) => {
    elem.addEventListener('mouseenter', () => {
      if (!this.tools?.current.isDrawing) {
        if (this.currentHover !== elem)
          this.emit('mouseEnterAnnotation', annotation, elem);

        this.currentHover = elem;
      }
    });

    elem.addEventListener('mouseleave', () => {
      if (!this.tools?.current.isDrawing) {
        if (this.currentHover === elem) 
          this.emit('mouseLeaveAnnotation', annotation, elem);

        this.currentHover = null;
      }
    });

    if (isTouch) {
      elem.addEventListener('touchstart', evt => {
        evt.stopPropagation();
        this.currentHover = elem;
      });

      elem.addEventListener('touchend', evt => {
        const { clientX, clientY } = evt.changedTouches[0];
        const realTarget = document.elementFromPoint(clientX, clientY);
        evt.stopPropagation();

        if (elem.contains(realTarget)) {
          this.currentHover = elem;
          this.selectCurrentHover();
        }
      });
    }
  }

  _onMouseDown = evt => {
    if (!(this.readOnly || this.selectedShape || this.tools.current.isDrawing)) {
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
    g.setAttribute('data-id', annotation.id);

    g.annotation = annotation;

    this._attachMouseListeners(g, annotation);
    this.g.appendChild(g);

    format(g, annotation, this.formatter);

    return g;
  }

  addDrawingTool = plugin =>
    this.tools?.registerTool(plugin);

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
      this.tools?.current.stop();

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
    this.deselect();
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
    // Clear existing
    this.deselect();
    this.currentHover = null;

    const shapes = Array.from(this.g.querySelectorAll('.a9s-annotation'));
    shapes.forEach(s => this.g.removeChild(s));

    // Add
    annotations.sort((a, b) => shapeArea(b) - shapeArea(a));
    annotations.forEach(this.addAnnotation);
  }

  listDrawingTools = () =>
    this.tools?.listTools();

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
      if (this.disableSelect) {
        // Click only - no select
        this.emit('clickAnnotation', this.currentHover.annotation, this.currentHover);
      } else {
        this.selectShape(this.currentHover);
      }
    } else {
      this.deselect();
      this.emit('select', { skipEvent: true });
    }
  }

  selectShape = (shape, skipEvent) => {
    if (!skipEvent && !shape.annotation.isSelection)
      this.emit('clickAnnotation', shape.annotation, shape);
  
    // Don't re-select
    if (this.selectedShape?.annotation === shape.annotation)
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
      
      // If we attach immediately 'mouseEnter' will fire when the editable shape
      // is added to the DOM !
      setTimeout(() => this._attachMouseListeners(this.selectedShape.element, annotation), 1);

      // When using mouse, currentHover will be set by mouseEnter, but
      // that doesn't happen in touch
      if (isTouch)
        this.currentHover = this.selectedShape;

      this.selectedShape.on('update', fragment => {
        if (this.selectedShape)
          this.emit('updateTarget', this.selectedShape.element, fragment);
      });

      if (!skipEvent)
        this.emit('select', { annotation, element: this.selectedShape.element });
    } else {
      addClass(shape, 'selected');
      this.selectedShape = shape;

      if (!skipEvent)
        this.emit('select', { annotation, element: shape, skipEvent });
    }
  }

  setDrawingTool = shape => {
    if (this.tools) {
      this.tools.current?.stop();
      this.tools.setCurrent(shape);
    }
  }

  setVisible = visible => {
    if (visible) {
      this.svg.style.display = null;
    } else {
      this.deselect();
      this.svg.style.display = 'none';
    }
  }

}
