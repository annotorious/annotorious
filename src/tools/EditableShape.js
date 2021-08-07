import { ToolLike } from './Tool';
import { SVG_NAMESPACE } from '../util/SVG';

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

  drawHandle = (x, y) => {
    const containerGroup = document.createElementNS(SVG_NAMESPACE, 'g');
    containerGroup.setAttribute('class', 'a9s-handle');

    const group = document.createElementNS(SVG_NAMESPACE, 'g');

    const drawCircle = r => {
      const c = document.createElementNS(SVG_NAMESPACE, 'circle');
      c.setAttribute('cx', x);
      c.setAttribute('cy', y);
      c.setAttribute('r', r);
      return c;
    }

    const radius = this.config.handleRadius || 6;

    const inner = drawCircle(radius);
    inner.setAttribute('class', 'a9s-handle-inner')

    const outer = drawCircle(radius + 1);
    outer.setAttribute('class', 'a9s-handle-outer')

    group.appendChild(outer);
    group.appendChild(inner);

    containerGroup.appendChild(group);
    return containerGroup;
  }

  setHandleXY = (handle, x, y) => {
    const inner = handle.querySelector('.a9s-handle-inner');
    inner.setAttribute('cx', x);
    inner.setAttribute('cy', y);

    const outer = handle.querySelector('.a9s-handle-outer');
    outer.setAttribute('cx', x);
    outer.setAttribute('cy', y);
  }

  getHandleXY = handle => {
    const outer = handle.querySelector('.a9s-handle-outer');
    return {
      x: parseFloat(outer.getAttribute('cx')),
      y: parseFloat(outer.getAttribute('cy'))
    }
  }

  scaleHandles = scale => {
    this.handles.forEach(handle => {
      const inner = handle.querySelector('.a9s-handle-inner');
      const outer = handle.querySelector('.a9s-handle-outer');

      const radius = scale * (this.config.handleRadius || 6);

      inner.setAttribute('r', radius);
      outer.setAttribute('r', radius);
    });
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
