import EventEmitter from 'tiny-emitter';
import { drawEmbeddedSVG, toSVGTarget } from '../../annotations/selectors/EmbeddedSVG';
import { SVG_NAMESPACE } from '../../SVGConst';

const drawHandle = pt => {
  const group = document.createElementNS(SVG_NAMESPACE, 'g');
  group.setAttribute('class', 'vertex-handle');

  const drawCircle = r => {
    const c = document.createElementNS(SVG_NAMESPACE, 'circle');
    c.setAttribute('cx', pt.x);
    c.setAttribute('cy', pt.y);
    c.setAttribute('r', r);
    return c;
  }

  const inner = drawCircle(7);
  inner.setAttribute('class', 'vertex-handle-inner')

  const outer = drawCircle(8);
  outer.setAttribute('class', 'vertex-handle-outer')

  group.appendChild(outer);
  group.appendChild(inner);

  return group;
}

const moveHandle = (handle, pt) => {
  const inner = handle.querySelector('.vertex-handle-inner');
  inner.setAttribute('cx', pt.x);
  inner.setAttribute('cy', pt.y);

  const outer = handle.querySelector('.vertex-handle-outer');    
  outer.setAttribute('cx', pt.x);
  outer.setAttribute('cy', pt.y);
}


// Shorthand
const getPoints = shape =>
  Array.from(shape.querySelector('.inner').points)

/**
 * An editable rectangle shape.
 */
export default class EditablePolygon extends EventEmitter {

  constructor(annotation, g) {
    super();

    this.annotation = annotation;

    // SVG element
    this.svg = g.closest('svg');

    this.svg.addEventListener('mousemove', this.onMouseMove);
    this.svg.addEventListener('mouseup', this.onMouseUp);

    // 'g' for the editable polygon compound shape
    this.group = document.createElementNS(SVG_NAMESPACE, 'g');
    this.shape = drawEmbeddedSVG(annotation);
    this.shape.setAttribute('class', 'a9s-annotation editable selected');
    this.group.appendChild(this.shape);

    this.handles = getPoints(this.shape).map(pt => {
      const handle = drawHandle(pt);
      handle.addEventListener('mousedown', this.onGrab(handle));

      this.group.appendChild(handle);
      return handle;
    });

    /*
    this.rectangle.querySelector('.inner')
      .addEventListener('mousedown', this.onGrab(this.rectangle));
    */

    g.appendChild(this.group);

    // The grabbed element (handle or entire shape), if any
    this.grabbedElem = null; 

    // Mouse xy offset inside the shape, if mouse pressed
    this.mouseOffset = null;

    // this.enableResponsive()
  }

  setPoints = (points) => {
    const str = points.map(pt => `${pt.x},${pt.y}`).join();

    const inner = this.shape.querySelector('.inner');
    inner.setAttribute('points', str);

    const outer = this.shape.querySelector('.outer');
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
    // const pos = this.getMousePosition(evt);
    // const { x, y } = getRectSize(this.rectangle);
    // this.mouseOffset = { x: pos.x - x, y: pos.y - y };  
  }

  onMouseMove = evt => {
    if (this.grabbedElem) {
      const pos = this.getMousePosition(evt);

      if (this.grabbedElem === this.shape) {
        /* x/y changes by mouse offset, w/h remains unchanged
        const { w, h } = getRectSize(this.rectangle);
        const x = pos.x - this.mouseOffset.x;
        const y = pos.y - this.mouseOffset.y;

        this.setSize(x, y, w, h); 
        this.emit('update', toRectFragment(x, y, w, h)); 
        */
      } else {
        // Handles
        const handleIdx = this.handles.indexOf(this.grabbedElem);
        
        const updatedPoints = getPoints(this.shape).map((pt, idx) =>
          (idx === handleIdx) ? pos : pt);
        
        this.setPoints(updatedPoints);
        moveHandle(this.handles[handleIdx], pos);
      
        this.emit('update', toSVGTarget(this.shape)); 
      }
    }
  }


  onMouseUp = evt => {
    this.grabbedElem = null;
    this.mouseOffset = null;
  }

  get element() {
    return this.shape;
  }

  destroy = () => {
    this.group.parentNode.removeChild(this.group);

    // if (this.resizeObserver)
    //  this.resizeObserver.disconnect();
    
    // this.resizeObserver = null;
  }

}