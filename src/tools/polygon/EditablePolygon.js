import EventEmitter from 'tiny-emitter';
import { drawEmbeddedSVG, toSVGTarget } from '../../selectors/EmbeddedSVG';
import { SVG_NAMESPACE } from '../../util/SVG';
import { format } from '../../util/Formatting';
import { drawHandle, setHandleXY } from '../Tool';
import Mask from './PolygonMask';

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

    // SVG markup for this class looks like this:
    // 
    // <g>
    //   <path class="a9s-selection mask"... />
    //   <g> <-- return this node as .element
    //     <polygon class="a9s-outer" ... />
    //     <polygon class="a9s-inner" ... />
    //     <g class="a9s-handle" ...> ... </g>
    //     <g class="a9s-handle" ...> ... </g>
    //     <g class="a9s-handle" ...> ... </g>
    //     ...
    //   </g> 
    // </g>

    // 'g' for the editable polygon compound shape
    this.containerGroup = document.createElementNS(SVG_NAMESPACE, 'g');

    this.shape = drawEmbeddedSVG(annotation);
    this.shape.setAttribute('class', `a9s-annotation editable selected`);
    this.shape.querySelector('.a9s-inner')
      .addEventListener('mousedown', this.onGrab(this.shape));

    format(this.shape, annotation, config.formatter);

    this.mask = new Mask(env.image, this.shape.querySelector('.a9s-inner'));
    
    this.containerGroup.appendChild(this.mask.element);

    this.elementGroup = document.createElementNS(SVG_NAMESPACE, 'g');
    this.elementGroup.appendChild(this.shape);

    this.handles = getPoints(this.shape).map(pt => {
      const handle = drawHandle(pt.x, pt.y);
      handle.addEventListener('mousedown', this.onGrab(handle));
      this.elementGroup.appendChild(handle);
      return handle;
    });

    this.containerGroup.appendChild(this.elementGroup);
    g.appendChild(this.containerGroup);

    // The grabbed element (handle or entire shape), if any
    this.grabbedElem = null;

    // Mouse grab point
    this.grabbedAt = null;

    // Bit of a hack. If we are dealing with a 'real' image, we enable
    // reponsive mode. OpenSeadragon handles scaling in a different way,
    // so we don't need responsive mode.
    const { image } = env;
    if (image instanceof Element || image instanceof HTMLDocument)
      this.enableResponsive();
  }

  get element() {
    return this.elementGroup;
  }

  enableResponsive = () => {
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        const svgBounds = this.svg.getBoundingClientRect();
        const { width, height } = this.svg.viewBox.baseVal;

        const scaleX = width / svgBounds.width;
        const scaleY = height / svgBounds.height;

        this.scaleHandles(scaleX, scaleY);
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

  setPoints = (points) => {
    const str = points.map(pt => `${pt.x},${pt.y}`).join();

    const inner = this.shape.querySelector('.a9s-inner');
    inner.setAttribute('points', str);

    const outer = this.shape.querySelector('.a9s-outer');
    outer.setAttribute('points', str);

    this.mask.redraw();
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
    return pt.matrixTransform(this.containerGroup.getScreenCTM().inverse());
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

        const updatedPoints = getPoints(this.shape).map(pt =>
          ({ x: pt.x + dx, y: pt.y + dy }));

        this.grabbedAt = pos;

        this.setPoints(updatedPoints);
        updatedPoints.forEach((pt, idx) => setHandleXY(this.handles[idx], pt.x, pt.y));
        
        this.emit('update', toSVGTarget(this.shape, this.env.image));
      } else {
        const handleIdx = this.handles.indexOf(this.grabbedElem);

        const updatedPoints = getPoints(this.shape).map((pt, idx) =>
          (idx === handleIdx) ? pos : pt);

        this.setPoints(updatedPoints);
        setHandleXY(this.handles[handleIdx], pos.x, pos.y);

        this.emit('update', toSVGTarget(this.shape, this.env.image));
      }
    }
  }

  onMouseUp = evt => {
    this.grabbedElem = null;
    this.grabbedAt = null;
  }

  destroy = () => {
    this.containerGroup.parentNode.removeChild(this.containerGroup);

    if (this.resizeObserver)
      this.resizeObserver.disconnect();

    this.resizeObserver = null;
  }

}
