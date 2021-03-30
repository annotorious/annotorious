import EventEmitter from 'tiny-emitter';

const IMPLEMENTATION_MISSING = "An implementation is missing";

export default class EditableShape extends EventEmitter {

  constructor(annotation, g, config, env) {
    super();

    this.annotation = annotation;

    this.g = g;

    this.config = config;
    this.env = env;

    this.svg = g.closest('svg');

    // Implementations need to override the handles list
    this.handles = [];

    // Bit of a hack. If we are dealing with a 'real' image, we enable
    // reponsive mode. OpenSeadragon handles scaling in a different way,
    // so we don't need responsive mode.
    const { image } = env;
    if (image instanceof Element || image instanceof HTMLDocument)
      this.enableResponsive();
  }

  enableResponsive = () => {
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        const svgBounds = this.svg.getBoundingClientRect();
        const { width, height } = this.svg.viewBox.baseVal;

        const scale = Math.max(
          width / svgBounds.width,
          height / svgBounds.height
        );

        this.scaleHandles(scale);
      });
      
      this.resizeObserver.observe(this.svg.parentNode);
    }
  }

  scaleHandles = (scaleOrScaleX, optScaleY) => {
    const scaleX = scaleOrScaleX;
    const scaleY = optScaleY || scaleOrScaleX;

    this.handles.forEach(handle => 
      handle.firstChild.setAttribute('transform', `scale(${scaleX}, ${scaleY})`));
  }

  toSVG = (x, y) => {
    const pt = this.svg.createSVGPoint();

    const { left, top } = this.svg.getBoundingClientRect();
    pt.x = x + left;
    pt.y = y + top;

    return pt.matrixTransform(this.g.getScreenCTM().inverse());
  }

  // Implementations MUST override theis method
  get element() {	
    throw new Error(IMPLEMENTATION_MISSING);
  }

  // Implementations can extend this (calling super)
  destroy() {
    if (this.resizeObserver)
      this.resizeObserver.disconnect();
    
    this.resizeObserver = null;
  }

}