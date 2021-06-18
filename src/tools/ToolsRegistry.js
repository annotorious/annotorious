import EventEmitter from 'tiny-emitter';
import RubberbandRectTool from './rectangle/RubberbandRectTool';
import RubberbandCircleTool from './circle/RubberbandCircleTool';
import RubberbandPolygonTool from './polygon/RubberbandPolygonTool';

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
    this._registered = [
      RubberbandRectTool,
      RubberbandCircleTool,
      RubberbandPolygonTool
    ];

    this.setCurrent(RubberbandRectTool);
  }

  listTools = () =>
    this._registered.map(impl => impl.identifier);

  registerTool = impl =>
    this._registered.push(impl);

  unregisterTool = id =>
    this._registered = this._registered.filter(impl => impl.identifier !== id);

  /** 
   * Sets a drawing tool by providing an implementation, or the ID
   * of a built-in toll.
   */
  setCurrent = toolOrId => {
    const Tool = (typeof toolOrId === 'string' || toolOrId instanceof String) ?
      this._registered.find(impl => impl.identifier === toolOrId) :
      toolOrId;

    this._current = new Tool(this._g, this._config, this._env);
    this._current.on('startSelection', pt => this.emit('startSelection', pt));
    this._current.on('complete', evt => this.emit('complete', evt));
    this._current.on('cancel', evt => this.emit('cancel', evt));
  }

  forAnnotation = annotation => {
    // First target
    const [ target, ..._ ] = annotation.targets;
    const renderedVia = target.renderedVia?.name;

    const Tool = renderedVia ?
      this._registered.find(impl => impl.identifier === renderedVia) :
      this._registered.find(impl => impl.supports(annotation));

    return Tool ? new Tool(this._g, this._config, this._env) : null;
  }

  get current() {
    return this._current;
  }
  
}