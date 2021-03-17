import EventEmitter from 'tiny-emitter';
import { SVG_NAMESPACE } from '../util/SVG';

const IMPLEMENTATION_MISSING = "An implementation is missing";

/**
 * Base class that adds some convenience stuff for tool plugins.
 */
export default class Tool extends EventEmitter {

  constructor(g, config, env) {
    super();

    // Annotationlayer SVG element
    this.svg = g.closest('svg');
    
    // SVG group holding all the a9s contents.
    // In AnnotoriousOSD, this is the element the 
    // transoform gets applied to.
    this.g = g;

    this.config = config;
    this.env = env;
  }

  toSVG = (x, y) => {
    const pt = this.svg.createSVGPoint();

    const { left, top } = this.svg.getBoundingClientRect();
    pt.x = x + left;
    pt.y = y + top;

    return pt.matrixTransform(this.g.getScreenCTM().inverse());
  }

  attachListeners = ({ mouseMove, mouseUp, dblClick }) => {
    // Handle SVG conversion on behalf of tool implementations
    if (mouseMove) {
      this.mouseMove = evt => {
        const { x , y } = this.toSVG(evt.layerX, evt.layerY);
        mouseMove(x, y, evt);
      }

      // Mouse move goes on SVG element
      this.svg.addEventListener('mousemove', this.mouseMove);   
    }

    if (mouseUp) {
      this.mouseUp = evt => {
        const { x , y } = this.toSVG(evt.layerX, evt.layerY);
        mouseUp(x, y, evt);
      }

      // Mouse up goes on doc, so we capture events outside, too
      document.addEventListener('mouseup', this.mouseUp);
    }

    if (dblClick) {
      this.dblClick = evt => {
        const { x , y } = this.toSVG(evt.layerX, evt.layerY);        
        dblClick(x, y, evt);
      }

      this.svg.addEventListener('dblclick', this.onDblClick);
    }
     
  }

  detachListeners = () => {
    if (this.mouseMove)
      this.svg.removeEventListener('mousemove', this.mouseMove);
    
    if (this.mouseUp)
      document.removeEventListener('mouseup', this.mouseUp);

    if (this.dblClick)
      this.svg.removeEventListener('dblclick', this.dblClick);
  }

  start = evt => {
    // Handle SVG conversion on behalf of tool implementations
    const { x , y } = this.toSVG(evt.layerX, evt.layerY);
    this.startDrawing(x, y, evt);
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

  createEditableShape = annotation => {
    throw new Error(IMPLEMENTATION_MISSING);
  } 

}

// In addition, Tool implementations need to implement the following static methods

// Tool.identifier = '...'

Tool.supports = annotatation => {
  throw new Error(IMPLEMENTATION_MISSING);
}

/**
 * Common code for drawing resize handles
 */
 export const drawHandle = (x, y) => {
  const containerGroup = document.createElementNS(SVG_NAMESPACE, 'g');
  containerGroup.setAttribute('class', 'a9s-handle');
  containerGroup.setAttribute('transform-origin', `${x}px ${y}px`);

  const group = document.createElementNS(SVG_NAMESPACE, 'g');
  group.setAttribute('transform-origin', `${x}px ${y}px`);

  const drawCircle = r => {
    const c = document.createElementNS(SVG_NAMESPACE, 'circle');
    c.setAttribute('cx', x);
    c.setAttribute('cy', y);
    c.setAttribute('r', r);
    return c;
  }

  const inner = drawCircle(6);
  inner.setAttribute('class', 'a9s-handle-inner')

  const outer = drawCircle(7);
  outer.setAttribute('class', 'a9s-handle-outer')

  group.appendChild(outer);
  group.appendChild(inner);

  containerGroup.appendChild(group);
  return containerGroup;
}

/**
 * Common code for setting handle position
 */
export const setHandleXY = (handle, x, y) => {
  handle.setAttribute('transform-origin', `${x}px ${y}px`);	
  handle.firstChild.setAttribute('transform-origin', `${x}px ${y}px`);	

  const inner = handle.querySelector('.a9s-handle-inner');	
  inner.setAttribute('cx', x);	
  inner.setAttribute('cy', y);	

  const outer = handle.querySelector('.a9s-handle-outer');	
  outer.setAttribute('cx', x);	
  outer.setAttribute('cy', y);
}

// Just some convenience shortcuts to client-core, for quicker 
// importing in plugins. (In a way, the intention is to make the 
// Tool class serve as a kind of mini-SDK).
export { default as Selection } from '@recogito/recogito-client-core/src/Selection';
export { default as WebAnnotation } from '@recogito/recogito-client-core/src/WebAnnotation';