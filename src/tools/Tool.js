import EventEmitter from 'tiny-emitter';
import { isTouchDevice } from '../util/Touch';
import { SVG_NAMESPACE } from '../util/SVG';

const IMPLEMENTATION_MISSING = "An implementation is missing";

const isTouch = isTouchDevice();

/**
 * A commmon base class for Tools and EditableShapes
 */
export class ToolLike extends EventEmitter {

  constructor(g, config, env) {
    super();

    this.svg = g.closest('svg');

    this.g = g;
    this.config = config;
    this.env = env;

    // Default image scale
    this.scale = 1;

    // Bit of a hack. If we are dealing with a 'real' image, we enable
    // reponsive mode. OpenSeadragon handles scaling in a different way,
    // so we don't need responsive mode.
    const { image } = env;
    if (image instanceof Element || image instanceof HTMLDocument)
      this.enableResponsive();
  }

  /**
   * Implementations MAY extend this (calling super),
   * to destroy SVG elements, mask, etc.
   */
  destroy() {
    if (this.resizeObserver)
      this.resizeObserver.disconnect();

    this.resizeObserver = null;
  }

  enableResponsive = () => {
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        const svgBounds = this.svg.getBoundingClientRect();
        const { width, height } = this.svg.viewBox.baseVal;

        this.scale = Math.max(
          width / svgBounds.width,
          height / svgBounds.height
        );

        if (this.onScaleChanged)
          this.onScaleChanged(this.scale);
      });

      this.resizeObserver.observe(this.svg.parentNode);
    }
  }

  getSVGPoint = evt => {
    const pt = this.svg.createSVGPoint();

    if (isTouch) {
      const bbox = this.svg.getBoundingClientRect();

      const x = evt.clientX - bbox.x;
      const y = evt.clientY - bbox.y;

      const { left, top } = this.svg.getBoundingClientRect();
      pt.x = x + left;
      pt.y = y + top;

      return pt.matrixTransform(this.g.getScreenCTM().inverse());
    } else {
      pt.x = evt.offsetX;
      pt.y = evt.offsetY;

      return pt.matrixTransform(this.g.getCTM().inverse());
    }
  }

  /*********************************/
  /*  Helpers for drawing handles  */
  /*********************************/

  drawHandle = (x, y) => {
    const containerGroup = document.createElementNS(SVG_NAMESPACE, 'g');
    containerGroup.setAttribute('class', 'a9s-handle');

    const group = document.createElementNS(SVG_NAMESPACE, 'g');

    const drawCircle = r => {
      const c = document.createElementNS(SVG_NAMESPACE, 'circle');
      c.setAttribute('cx', x);
      c.setAttribute('cy', y);
      c.setAttribute('r', r);
      return c;
    }

    const radius = this.config.handleRadius || 6;

    const inner = drawCircle(radius);
    inner.setAttribute('class', 'a9s-handle-inner')

    const outer = drawCircle(radius + 1);
    outer.setAttribute('class', 'a9s-handle-outer')

    group.appendChild(outer);
    group.appendChild(inner);

    containerGroup.appendChild(group);
    return containerGroup;
  }

  setHandleXY = (handle, x, y) => {
    const inner = handle.querySelector('.a9s-handle-inner');
    inner.setAttribute('cx', x);
    inner.setAttribute('cy', y);

    const outer = handle.querySelector('.a9s-handle-outer');
    outer.setAttribute('cx', x);
    outer.setAttribute('cy', y);
  }

  getHandleXY = handle => {
    const outer = handle.querySelector('.a9s-handle-outer');
    return {
      x: parseFloat(outer.getAttribute('cx')),
      y: parseFloat(outer.getAttribute('cy'))
    }
  }

  scaleHandle = handle => {
    const inner = handle.querySelector('.a9s-handle-inner');
    const outer = handle.querySelector('.a9s-handle-outer');

    const radius = this.scale * (this.config.handleRadius || 6);

    inner.setAttribute('r', radius);
    outer.setAttribute('r', radius);
  }

}

/**
 * Base class that adds some convenience stuff for tool plugins.
 */
export default class Tool extends ToolLike {

  constructor(g, config, env) {
    super(g, config, env);

    // We'll keep a flag set to false until
    // the user has started moving, so we can
    // fire the startSelection event
    this.started = false;
  }

  attachListeners = ({ mouseMove, mouseUp, dblClick }) => {
    // Handle SVG conversion on behalf of tool implementations
    if (mouseMove) {
      this.mouseMove = evt => {
        const { x , y } = this.getSVGPoint(evt);

        if (!this.started) {
          this.emit('startSelection', { x, y });
          this.started = true;
        }

        mouseMove(x, y, evt);
      }

      // Mouse move goes on SVG element
      this.svg.addEventListener('mousemove', this.mouseMove);
    }

    if (mouseUp) {
      this.mouseUp = evt => {
        if (evt.button !== 0) return;  // left click
        const { x , y } = this.getSVGPoint(evt);
        mouseUp(x, y, evt);
      }

      // Mouse up goes on doc, so we capture events outside, too
      document.addEventListener('mouseup', this.mouseUp);
    }

    if (dblClick) {
      this.dblClick = evt => {
        const { x , y } = this.getSVGPoint(evt);
        dblClick(x, y, evt);
      }

      document.addEventListener('dblclick', this.dblClick);
    }

  }

  detachListeners = () => {
    if (this.mouseMove)
      this.svg.removeEventListener('mousemove', this.mouseMove);

    if (this.mouseUp)
      document.removeEventListener('mouseup', this.mouseUp);

    if (this.dblClick)
      document.removeEventListener('dblclick', this.dblClick);
  }

  /**
   * If startOnSingleClick is true, the tool starts on single click
   * as well as drag. If false, starting strictly requires drag!
   */
  start = (evt, startOnSingleClick) => {
    // Handle SVG conversion on behalf of tool implementations
    const { x , y } = this.getSVGPoint(evt);
    this.startDrawing(x, y, startOnSingleClick, evt);
  }

  /**
   * Tool implementations MUST override these
   */

  get isDrawing() {
    throw new Error(IMPLEMENTATION_MISSING);
  }

  startDrawing = evt => {
    throw new Error(IMPLEMENTATION_MISSING);
  }

  createEditableShape = (annotation, formatters) => {
    throw new Error(IMPLEMENTATION_MISSING);
  }

}

// In addition, Tool implementations need to implement the following static methods

// Tool.identifier = '...'

Tool.supports = annotation => {
  throw new Error(IMPLEMENTATION_MISSING);
}

// Just some convenience shortcuts to client-core, for quicker
// importing in plugins. (In a way, the intention is to make the
// Tool class serve as a kind of mini-SDK).
export { default as Selection } from '@recogito/recogito-client-core/src/Selection';
export { default as WebAnnotation } from '@recogito/recogito-client-core/src/WebAnnotation';
