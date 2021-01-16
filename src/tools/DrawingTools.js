import EventEmitter from 'tiny-emitter';
import RubberbandRectTool from './rectangle/RubberbandRectTool';
import RubberbandPolygonTool from './polygon/RubberbandPolygonTool';
import { SVG_NAMESPACE } from '../util/SVG';

/** The drawing tool 'registry' **/
class DrawingToolRegistry extends EventEmitter {
 
  constructor(g, config, env) {
    super(); 

    // SVG annotation layer group
    this._g = g;

    // Annotorious user config
    this._config = config;

    // Environment settings
    this._env = env;

    // Registered tool implementations
    this._registered = {};

    // Current drawing tool
    this._current = null;

    this.setDefaults();
  }

  setDefaults() {
    this.registerTool('rect', RubberbandRectTool);
    this.registerTool('polygon', RubberbandPolygonTool);
    this.setCurrent('rect');
  }

  registerTool = (id, impl) => {
    this._registered[id] = impl;
  }

  /** 
   * Sets a drawing tool by providing an implementation, or the ID
   * of a built-in toll.
   */
  setCurrent = toolOrId => {
    if (typeof toolOrId === 'string' || toolOrId instanceof String) {
      const Tool = this._registered[toolOrId];
      if (Tool) {
        this._current = new Tool(this._g, this._config, this._env);
        this._current.on('complete', evt => this.emit('complete', evt));
        this._current.on('cancel', evt => this.emit('cancel', evt));
      }
    } else {
      this._current = toolOrId;
    }
  }

  /** TODO inefficient - maybe organize this in a different way **/
  forShape = svgShape => {
    const inner = svgShape.querySelector('.a9s-inner');
    const Tool = this._registered[inner.nodeName];
    return Tool ? new Tool(this._g, this._config, this._env) : null;
  }

  get current() {
    return this._current;
  }
  
}

export default DrawingToolRegistry;

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
