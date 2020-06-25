import EventEmitter from 'tiny-emitter';
import RubberbandRectTool from './rectangle/RubberbandRectTool';
import RubberbandPolygonTool from './polygon/RubberbandPolygonTool';

/** The drawing tool 'registry' **/
class DrawingToolRegistry extends EventEmitter {
 
  constructor(g) {
    super(); 

    // SVG annotation layer group
    this._g = g;

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
        this._current = new Tool(this._g);
        this._current.on('complete', evt => this.emit('complete', evt));
        this._current.on('cancel', evt => this.emit('cancel', evt));
      }
    } else {
      this._current = toolOrId;
    }
  }

  get current() {
    return this._current;
  }
  
}

export default DrawingToolRegistry;