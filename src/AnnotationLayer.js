import EventEmitter from 'tiny-emitter';
import { drawShape, shapeArea } from './selectors';
import { SVG_NAMESPACE, addClass, hasClass, removeClass } from './util/SVG';
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

    // Deprecate the old 'formatter' option 
    if (config.formatter)
      this.formatters = [ config.formatter ];
    else if (config.formatters)
      this.formatters = Array.isArray(config.formatters) ? config.formatters : [ config.formatters ];
    
    this.disableSelect = config.disableSelect;
    this.drawOnSingleClick = config.drawOnSingleClick; 

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

    const { naturalWidth, naturalHeight } = this.imageEl;

    if (!naturalWidth && !naturalHeight) {
      // Might be because a) the image has not loaded yet, or b) because it's not 
      // an image element (but maybe a CANVAS etc.)! Allow for both possibilities.
      const { width, height } = this.imageEl;
      this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

      // Plus: monkey-patch the element (won't work for images)
      if(this.imageEl.nodeName.toLowerCase() !== 'img') {
        this.imageEl.naturalWidth = width;
        this.imageEl.naturalHeight = height;
      }

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

    // On image resize...
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        // counter-scale non-scaling annotations
        this._refreshNonScalingAnnotations();

        // resize formatter elements (shape labels et al)
        this._scaleFormatterElements();
      });

      this.resizeObserver.observe(this.svg.parentNode);
    }
  }

  _attachMouseListeners = (elem, annotation) => {
    elem.addEventListener('mouseenter', () => {
      if (!this.tools?.current?.isDrawing) {
        if (this.currentHover !== elem)
          this.emit('mouseEnterAnnotation', annotation, elem);

        this.currentHover = elem;
      }
    });

    elem.addEventListener('mouseleave', () => {
      if (!this.tools?.current?.isDrawing) {
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
    if (evt.button !== 0) return;  // Left click

    if (!(this.readOnly || this.selectedShape || this.tools.current.isDrawing)) {
      // No active selection & not drawing now? Start drawing.
      this.tools.current.start(evt, this.drawOnSingleClick && !this.currentHover);
    } else if (!this.tools?.current?.isDrawing && this.selectedShape !== this.currentHover) {
      // Not drawing and another shape was clicked? Select.
      this.selectCurrentHover();
    }
  }

  _refreshNonScalingAnnotations = () => {
    const scale = this.getCurrentScale();
    
    // This happens after .destroy(), when this.svg still exists,
    // but has 0x0 size!
    if (scale === Infinity)
      return;

    Array.from(this.svg.querySelectorAll('.a9s-non-scaling')).forEach(shape => {
      shape.setAttribute('transform', `scale(${scale})`);
    });
  }

  _scaleFormatterElements = opt_shape => {
    const scale = this.getCurrentScale();

    if (opt_shape) {
      const el = opt_shape.querySelector('.a9s-formatter-el');
      if (el)
        el.firstChild.setAttribute('transform', `scale(${scale})`);
    } else {
      const elements = Array.from(this.g.querySelectorAll('.a9s-formatter-el'));
      elements.forEach(el =>
        el.firstChild.setAttribute('transform', `scale(${scale})`));
    }
  }

  addAnnotation = annotation => {
    const g = drawShape(annotation, this.imageEl);

    addClass(g, 'a9s-annotation');
    g.setAttribute('data-id', annotation.id);

    g.annotation = annotation;

    this._attachMouseListeners(g, annotation);
    this.g.appendChild(g);

    format(g, annotation, this.formatters);
    this._scaleFormatterElements(g);

    return g;
  }

  addDrawingTool = plugin =>
    this.tools?.registerTool(plugin);

  addOrUpdateAnnotation = (annotation, previous) => {
    if (this.selectedShape && (this.selectedShape.annotation.isEqual(annotation) || this.selectedShape.annotation.isEqual(previous))) {
      this.deselect();
      this.emit('select', {});
    }

    if (previous)
      this.removeAnnotation(previous);

    this.removeAnnotation(annotation);

    const shape = this.addAnnotation(annotation);
    
    // Counter-scale non-scaling annotations
    if (hasClass(shape, 'a9s-non-scaling'))
      shape.setAttribute('transform', `scale(${this.getCurrentScale()})`);

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

  getCurrentScale = () => {
    const svgBounds = this.svg.getBoundingClientRect();
    const { width, height } = this.svg.viewBox.baseVal;

    return Math.max(
      width / svgBounds.width,
      height / svgBounds.height
    );
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
    annotations.sort((a, b) => shapeArea(b, this.imageEl) - shapeArea(a, this.imageEl));
    annotations.forEach(this.addAnnotation);

    // Counter-scale non-scaling annotations
    this._refreshNonScalingAnnotations();
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
    const shapes = Array.from(this.g.querySelectorAll('.a9s-annotation:not(.selected)'));

    const annotations = shapes.map(s => s.annotation);
    annotations.sort((a, b) => shapeArea(b, this.imageEl) - shapeArea(a, this.imageEl));

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

  removeDrawingTool = id =>
    this.tools?.unregisterTool(id);

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
      const toolForAnnotation = this.tools.forAnnotation(annotation);

      // Replace the shape with an editable version
      if (toolForAnnotation) {
        shape.parentNode.removeChild(shape);
        this.selectedShape = toolForAnnotation.createEditableShape(annotation, this.formatters);

        // Yikes... hack to make the tool act like SVG annotation shapes - needs redesign
        this.selectedShape.element.annotation = annotation;
        
        this._scaleFormatterElements(this.selectedShape.element);

        this.selectedShape.on('update', fragment => {
          if (this.selectedShape)
            this.emit('updateTarget', this.selectedShape.element, fragment);
        });

        // If we attach immediately 'mouseEnter' will fire when the editable shape
        // is added to the DOM!
        setTimeout(() => {
          // Can be undefined in headless mode, when saving immediately
          if (this.selectedShape) {
            this.currentHover = this.selectedShape.element;
            this._attachMouseListeners(this.selectedShape.element, annotation);
          }
        }, 1);
      } else {
        this.selectedShape = shape;
      }

      // When using mouse, currentHover will be set by mouseEnter, but
      // that doesn't happen in touch
      if (isTouch)
        this.currentHover = this.selectedShape;

      if (!skipEvent)
        this.emit('select', { annotation, element: this.selectedShape.element || this.selectedShape });
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

  stopDrawing = () => {
    this.tools?.current?.stop();
  }

}
