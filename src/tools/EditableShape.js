import { ToolLike } from './Tool';

const IMPLEMENTATION_MISSING = "An implementation is missing";

export default class EditableShape extends ToolLike {

  constructor(annotation, g, config, env) {
    super(g, config, env);

    this.annotation = annotation;

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
  
  /**
   * Implementations MUST override this method!
   * 
   * Must return the 'g' element with the a9s-annotation class.
   */
  get element() {
    throw new Error(IMPLEMENTATION_MISSING);
  }

  /**
   * Implementations MUST override this method!
   * 
   * The annotation argument MUST be used to update
   * the current state of the shape. It MUST NOT
   * be stored as 'this.annotation'! 'this.annotation'
   * MUST remain the original annotation at the time
   * this EditableShape was created, because we will
   * need it again in case the user cancels editing.
   * 
   * Thinking of it in React terms, 'this.annotation'
   * has the same purpose as props.annotation, whereas
   * this method affects state.
   */
  updateState = annotation => {
    throw new Error(IMPLEMENTATION_MISSING);
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

}
