import EditableShape from '../EditableShape';
import { drawEmbeddedSVG, toSVGTarget } from '../../selectors/EmbeddedSVG';
import { SVG_NAMESPACE } from '../../util/SVG';
import { format, setFormatterElSize } from '../../util/Formatting';
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
export default class EditablePolygon extends EditableShape {

  constructor(annotation, g, config, env) {
    super(annotation, g, config, env);

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
    this.shape.setAttribute('class', 'a9s-annotation editable selected');
    this.shape.querySelector('.a9s-inner')
      .addEventListener('mousedown', this.onGrab(this.shape));

    this.mask = new Mask(env.image, this.shape.querySelector('.a9s-inner'));
    
    this.containerGroup.appendChild(this.mask.element);

    this.elementGroup = document.createElementNS(SVG_NAMESPACE, 'g');
    this.elementGroup.appendChild(this.shape);

    this.handles = getPoints(this.shape).map(pt => {
      const handle = this.drawHandle(pt.x, pt.y);
      handle.addEventListener('mousedown', this.onGrab(handle));
      this.elementGroup.appendChild(handle);
      return handle;
    });

    this.containerGroup.appendChild(this.elementGroup);
    g.appendChild(this.containerGroup);

    format(this.shape, annotation, config.formatter);

    // The grabbed element (handle or entire shape), if any
    this.grabbedElem = null;

    // Mouse grab point
    this.grabbedAt = null;
  }

  setPoints = (points) => {
    const str = points.map(pt => `${pt.x},${pt.y}`).join();

    const inner = this.shape.querySelector('.a9s-inner');
    inner.setAttribute('points', str);

    const outer = this.shape.querySelector('.a9s-outer');
    outer.setAttribute('points', str);

    this.mask.redraw();

    const { x, y, width, height } = outer.getBBox();
    setFormatterElSize(this.elementGroup, x, y, width, height);
  }

  onGrab = grabbedElem => evt => {
    this.grabbedElem = grabbedElem;
    this.grabbedAt = this.getSVGPoint(evt);
  }

  onMouseMove = evt => {
    if (this.grabbedElem) {
      const pos = this.getSVGPoint(evt);

      if (this.grabbedElem === this.shape) {
        const dx = pos.x - this.grabbedAt.x;
        const dy = pos.y - this.grabbedAt.y;

        const updatedPoints = getPoints(this.shape).map(pt =>
          ({ x: pt.x + dx, y: pt.y + dy }));

        this.grabbedAt = pos;

        this.setPoints(updatedPoints);
        updatedPoints.forEach((pt, idx) => this.setHandleXY(this.handles[idx], pt.x, pt.y));
        
        this.emit('update', toSVGTarget(this.shape, this.env.image));
      } else {
        const handleIdx = this.handles.indexOf(this.grabbedElem);

        const updatedPoints = getPoints(this.shape).map((pt, idx) =>
          (idx === handleIdx) ? pos : pt);

        this.setPoints(updatedPoints);
        this.setHandleXY(this.handles[handleIdx], pos.x, pos.y);

        this.emit('update', toSVGTarget(this.shape, this.env.image));
      }
    }
  }

  onMouseUp = evt => {
    this.grabbedElem = null;
    this.grabbedAt = null;
  }

  get element() {
    return this.elementGroup;
  }

  destroy = () => {
    this.containerGroup.parentNode.removeChild(this.containerGroup);
    super.destroy();
  }

}
