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

const getBBox = shape =>
  shape.querySelector('.a9s-inner').getBBox();

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
    this.shape.querySelector('.a9s-inner')
      .addEventListener('mousedown', this.onGrab(this.shape));

    this.mask = new Mask(env.image, this.shape.querySelector('.a9s-inner'));
    
    this.containerGroup.appendChild(this.mask.element);

    this.elementGroup = document.createElementNS(SVG_NAMESPACE, 'g');
    this.elementGroup.setAttribute('class', 'a9s-annotation editable selected');
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
    // Not using .toFixed(1) because that will ALWAYS
    // return one decimal, e.g. "15.0" (when we want "15")
    const round = num => 
      Math.round(10 * num) / 10;

    const str = points.map(pt => `${round(pt.x)},${round(pt.y)}`).join(' ');

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
    const constrain = (coord, delta, max) =>
      coord + delta < 0 ? -coord : (coord + delta > max ? max - coord : delta);

    if (this.grabbedElem) {
      const pos = this.getSVGPoint(evt);

      if (this.grabbedElem === this.shape) {
        const { x, y, width, height } = getBBox(this.shape);

        const { naturalWidth, naturalHeight } = this.env.image;

        const dx = constrain(x, pos.x - this.grabbedAt.x, naturalWidth - width);
        const dy = constrain(y, pos.y - this.grabbedAt.y, naturalHeight - height);

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
