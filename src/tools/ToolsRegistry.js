import EventEmitter from 'tiny-emitter';
import RubberbandRectTool from './rectangle/RubberbandRectTool';
import RubberbandPolygonTool from './polygon/RubberbandPolygonTool';

/** The drawing tool 'registry' **/
export default class ToolRegistry extends EventEmitter {
 
  constructor(g, config, env) {
    super(); 

    // SVG annotation layer group
    this._g = g;

    // Annotorious user config
    this._config = config;

    // Environment settings
    this._env = env;

    // Registered tool implementations
    this._registered = {
      rect: RubberbandRectTool,
      polygon: RubberbandPolygonTool
    };

    this.setCurrent(RubberbandRectTool);
  }

  registerTool = (name, impl) =>
    this._registered[name] = impl;

  /** 
   * Sets a drawing tool by providing an implementation, or the ID
   * of a built-in toll.
   */
  setCurrent = toolOrId => {
    const Tool = (typeof toolOrId === 'string' || toolOrId instanceof String) ?
      this._registered[toolOrId] :
      toolOrId;

    this._current = new Tool(this._g, this._config, this._env);
    this._current.on('complete', evt => this.emit('complete', evt));
    this._current.on('cancel', evt => this.emit('cancel', evt));
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