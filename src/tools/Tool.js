import EventEmitter from 'tiny-emitter';
import Selection from '@recogito/recogito-client-core/src/Selection';
import WebAnnotation from '@recogito/recogito-client-core/src/WebAnnotation';

const IMPLEMENTATION_MISSING = 'Implementation is missing';

/**
 * Base class that adds some convenience stuff for tool plugins.
 */
class Tool extends EventEmitter {

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

  attachListeners = ({ mouseMove, mouseUp }) => {
    this.svg.addEventListener('mousemove', mouseMove);    
    document.addEventListener('mouseup', mouseUp);
  }

  detachListeners = ({ mouseMove, mouseUp}) => {
    this.svg.removeEventListener('mousemove', mouseMove);
    document.removeEventListener('mouseup', mouseUp);
  }

  toSVG =  (x, y) => {
    const pt = this.svg.createSVGPoint();

    const { left, top } = this.svg.getBoundingClientRect();
    pt.x = x + left;
    pt.y = y + top;

    return pt.matrixTransform(this.g.getScreenCTM().inverse());
  }

  /** 
   * Tool implementations MUST override these
   */

  get isDrawing() {
    throw new Error(IMPLEMENTATION_MISSING);
  }

  get supportsModify() {
    throw new Error(IMPLEMENTATION_MISSING);
  }

  startDrawing = evt => {
    throw new Error(IMPLEMENTATION_MISSING);
  }

  /**
   * Tool implementations CAN provide this implementations
   */
  
  // createEditableShape = annotation => ... 

}

// Just some convenience shortcuts to client-core, for quicker 
// importing in plugins. (In a way, the intention is to make the 
// Tool class serve as a kind of mini-SDK).

Tool.Selection = Selection;
Tool.WebAnnotation = WebAnnotation;

export default Tool;