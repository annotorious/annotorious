import { SVG_NAMESPACE } from '../util/SVG';
import { ToolLike } from './Tool';
import { getRectSize } from '../selectors/RectFragment';

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
  
  transform = (extent, scale) => {
    const fn = xy => {
      const x = scale * (xy.x - extent.x);
      const y = scale * (xy.y - extent.y);
      
      return { x, y };
    }

    const offscreenBuffer = document.createElementNS(SVG_NAMESPACE, 'svg');
    const g = document.createElementNS(SVG_NAMESPACE, 'g');
    offscreenBuffer.appendChild(g);

    // The clone has everything in original image coordinates. We can
    // use that as a starting point to create the transformed copy
    this.constructor(this.element.annotation, g, this.config, this.env);

    // All rects in original image coordinates
    const rects = Array.from(g.querySelectorAll('rect'));
    const rectsToUpdate = Array.from(this.element.parentNode.querySelectorAll('rect'));

    rects.forEach((rect, idx) => {
      const x = rect.getAttribute('x');
      const y = rect.getAttribute('y');
      const width = rect.getAttribute('width');
      const height = rect.getAttribute('height');

      const xy = fn({ x, y });

      rectsToUpdate[idx].setAttribute('x', xy.x);
      rectsToUpdate[idx].setAttribute('y', xy.y);
      rectsToUpdate[idx].setAttribute('width', width * scale);
      rectsToUpdate[idx].setAttribute('height', height * scale);
    });

    // All circles in original image coordinates
    const circles = Array.from(g.querySelectorAll('circle'));
    const circlesToUpdate = Array.from(this.element.parentNode.querySelectorAll('circle'));
    
    circles.forEach((circle, idx) => {
      const cx = circle.getAttribute('cx');
      const cy = circle.getAttribute('cy');

      const xy = fn({ x: cx, y: cy});

      circlesToUpdate[idx].setAttribute('cx', xy.x);
      circlesToUpdate[idx].setAttribute('cy', xy.y);
    });

  }
  
  /*
  transform = (extent, scale) => {

    this.setSize(getRectSize(this.rect));

    /*

    const fn = imgPoint => {

      const x = (imgPoint.x - extent.x) * scale;
      const y = (imgPoint.y - extent.y) * scale;

      return { x, y };
    }

    const offscreenBuffer = document.createElementNS(SVG_NAMESPACE, 'svg');
    const g = document.createElementNS(SVG_NAMESPACE, 'g');
    offscreenBuffer.appendChild(g);

    // The clone has everything in original image coordinates. We can
    // use that as a starting point to create the transformed copy
    this.constructor(this.annotation, g, this.config, this.env);

    const circles = Array.from(this.g.querySelectorAll('circle'));
    
    const origRes = Array.from(g.querySelectorAll('circle'));

    origRes.forEach((circle, idx) => {
      console.log(circle);

      const cx = circle.getAttribute('cx');
      const cy = circle.getAttribute('cy');


      const { x, y } = fn({ x: cx, y: cy});

      console.log('circle', cx, cy, 'to', x, y);

      // circles[idx].setAttribute('cx', x);
      // circles[idx].setAttribute('cx', y);
    });

    /*
    const rects = Array.from(this.g.querySelectorAll('rect'));
    Array.from(g.querySelectorAll('rect')).forEach((rect, idx) => {
      console.log(rect);

      const x = rect.getAttribute('x');
      const y = rect.getAttribute('y');
      const width = rect.getAttribute('width');
      const height = rect.getAttribute('height');

      console.log('before', width, height);

      const xy = fn({ x, y });
      const bottomright = fn({ x: x + width, y: y + height });
      console.log('after', bottomright.x - xy.x, bottomright.y - xy.y);

      rects[idx].setAttribute('x', xy.x);
      rects[idx].setAttribute('y', xy.y);
      rects[idx].setAttribute('width', bottomright.x - xy.x);
      rects[idx].setAttribute('height', bottomright.y - xy.y);
    });
    */

  //}

  // Implementations MUST override this method
  get element() {
    throw new Error(IMPLEMENTATION_MISSING);
  }

  // Implementations MUST override this method
  update = annotation => {
    throw new Error(IMPLEMENTATION_MISSING);
  }

  // Implementations can extend this (calling super)
  destroy() {
    if (this.resizeObserver)
      this.resizeObserver.disconnect();

    this.resizeObserver = null;
  }

}
