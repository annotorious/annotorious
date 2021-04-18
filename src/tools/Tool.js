import EventEmitter from 'tiny-emitter';

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

  getSVGPoint = evt => {
    const bbox = this.svg.getBoundingClientRect();

    const x = evt.clientX - bbox.x;
    const y = evt.clientY - bbox.y;

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
        const { x , y } = this.getSVGPoint(evt);
        mouseMove(x, y, evt);
      }

      // Mouse move goes on SVG element
      this.svg.addEventListener('mousemove', this.mouseMove);   
    }

    if (mouseUp) {
      this.mouseUp = evt => {
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

      this.svg.addEventListener('dblclick', this.dblClick);
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
    const { x , y } = this.getSVGPoint(evt);
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

Tool.supports = annotation => {
  throw new Error(IMPLEMENTATION_MISSING);
}

// Just some convenience shortcuts to client-core, for quicker 
// importing in plugins. (In a way, the intention is to make the 
// Tool class serve as a kind of mini-SDK).
export { default as Selection } from '@recogito/recogito-client-core/src/Selection';
export { default as WebAnnotation } from '@recogito/recogito-client-core/src/WebAnnotation';