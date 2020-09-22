import EventEmitter from 'tiny-emitter';
import { drawEmbeddedSVG, toSVGTarget } from '../../selectors/EmbeddedSVG';
import { SVG_NAMESPACE } from '../../SVG';
import { format } from '../../Formatting';

const drawHandle = pt => {
  const group = document.createElementNS(SVG_NAMESPACE, 'g');
  group.setAttribute('class', 'a9s-handle');
  group.setAttribute('transform-origin', `${pt.x}px ${pt.y}px`);

  const drawCircle = r => {
    const c = document.createElementNS(SVG_NAMESPACE, 'circle');
    c.setAttribute('cx', pt.x);
    c.setAttribute('cy', pt.y);
    c.setAttribute('r', r);
    return c;
  }

  const inner = drawCircle(6);
  inner.setAttribute('class', 'a9s-handle-inner')

  const outer = drawCircle(7);
  outer.setAttribute('class', 'a9s-handle-outer')

  group.appendChild(outer);
  group.appendChild(inner);

  return group;
}

const moveHandle = (handle, pt) => {
  handle.setAttribute('transform-origin', `${pt.x}px ${pt.y}px`);

  const inner = handle.querySelector('.a9s-handle-inner');
  inner.setAttribute('cx', pt.x);
  inner.setAttribute('cy', pt.y);

  const outer = handle.querySelector('.a9s-handle-outer');
  outer.setAttribute('cx', pt.x);
  outer.setAttribute('cy', pt.y);
}

const getPoints = shape => {
  // Could just be Array.from(shape.querySelector('.inner').points) but...
  // IE11 :-(
  const pointList = shape.querySelector('.a9s-inner').points;
  const points = [];

  for (let i=0; i<pointList.numberOfItems; i++) {
    points.push(pointList.getItem(i));
  }

  return points;
}

/**
 * An editable rectangle shape.
 */
export default class EditablePolygon extends EventEmitter {

  constructor(annotation, g, config, env) {
    super();

    this.annotation = annotation;

    this.env = env;

    // SVG element
    this.svg = g.closest('svg');

    this.svg.addEventListener('mousemove', this.onMouseMove);
    this.svg.addEventListener('mouseup', this.onMouseUp);

    // 'g' for the editable polygon compound shape
    this.group = document.createElementNS(SVG_NAMESPACE, 'g');
    this.shape = drawEmbeddedSVG(annotation);
    this.shape.setAttribute('class', `a9s-annotation editable selected`);

    format(this.shape, annotation, config.formatter);

    this.group.appendChild(this.shape);

    this.handles = getPoints(this.shape).map(pt => {
      const handle = drawHandle(pt);
      handle.addEventListener('mousedown', this.onGrab(handle));
      this.group.appendChild(handle);
      return handle;
    });

    this.shape.querySelector('.a9s-inner')
      .addEventListener('mousedown', this.onGrab(this.shape));

    g.appendChild(this.group);

    // The grabbed element (handle or entire shape), if any
    this.grabbedElem = null;

    // Mouse grab point
    this.grabbedAt = null;

    this.enableResponsive()
  }

  enableResponsive = () => {
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        const svgBounds = this.svg.getBoundingClientRect();
        const { width, height } = this.svg.viewBox.baseVal;

        const scaleX = width / svgBounds.width;
        const scaleY = height / svgBounds.height;

        this.handles.forEach(handle =>
          handle.setAttribute('transform', `scale(${scaleX}, ${scaleY})`));
      });

      this.resizeObserver.observe(this.svg.parentNode);
    }
  }

  setPoints = (points) => {
    const str = points.map(pt => `${pt.x},${pt.y}`).join();

    const inner = this.shape.querySelector('.a9s-inner');
    inner.setAttribute('points', str);

    const outer = this.shape.querySelector('.a9s-outer');
    outer.setAttribute('points', str);
  }

  /**
   * Converts mouse coordinates to SVG coordinates
   *
   * TODO redundant with EditableRect
   */
  getMousePosition = evt => {
    const pt = this.svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    return pt.matrixTransform(this.svg.getScreenCTM().inverse());
  }

  onGrab = grabbedElem => evt => {
    this.grabbedElem = grabbedElem;
    this.grabbedAt = this.getMousePosition(evt);
  }

  onMouseMove = evt => {
    if (this.grabbedElem) {
      const pos = this.getMousePosition(evt);

      if (this.grabbedElem === this.shape) {
        const dx = pos.x - this.grabbedAt.x;
        const dy = pos.y - this.grabbedAt.y;

        const updatedPoints = getPoints(this.shape).map(pt => {
          return { x: pt.x + dx, y: pt.y + dy }
        });

        this.grabbedAt = pos;

        this.setPoints(updatedPoints);

        updatedPoints.forEach((pt, idx) => moveHandle(this.handles[idx], pt));

        this.emit('update', toSVGTarget(this.shape, this.env.image));
      } else {
        // Handles
        const handleIdx = this.handles.indexOf(this.grabbedElem);

        const updatedPoints = getPoints(this.shape).map((pt, idx) =>
          (idx === handleIdx) ? pos : pt);

        this.setPoints(updatedPoints);
        moveHandle(this.handles[handleIdx], pos);

        this.emit('update', toSVGTarget(this.shape, this.env.image));
      }
    }
  }

  onMouseUp = evt => {
    this.grabbedElem = null;
    this.grabbedAt = null;
  }

  get element() {
    return this.shape;
  }

  destroy = () => {
    this.group.parentNode.removeChild(this.group);

    if (this.resizeObserver)
      this.resizeObserver.disconnect();

    this.resizeObserver = null;
  }

}
