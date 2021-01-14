import EventEmitter from 'tiny-emitter';
import RubberbandRectTool from './rectangle/RubberbandRectTool';
import RubberbandPolygonTool from './polygon/RubberbandPolygonTool';
import RubberbandCircleTool from "./circle/RubberbandCircleTool";

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
    this.registerTool('circle', RubberbandCircleTool);

    this.setCurrent('rect');
    // this.setCurrent('circle');
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