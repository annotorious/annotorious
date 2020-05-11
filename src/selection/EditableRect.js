import EventEmitter from 'tiny-emitter';
import { drawRect, getCorners, getRectSize, setRectSize, parseRectFragment } from '../annotations/RectFragment';
import { SVG_NAMESPACE } from '../SVGConst';

const drawHandle = (x, y, className) => {
  const g = document.createElementNS(SVG_NAMESPACE, 'g');
  g.setAttribute('class', `resize-handle ${className}`);
  g.setAttribute('transform-origin', `${x}px ${y}px`);

  const inner = document.createElementNS(SVG_NAMESPACE, 'rect');   
  inner.setAttribute('x', x - 5.5);
  inner.setAttribute('y', y - 5.5);
  inner.setAttribute('width', 11);
  inner.setAttribute('height', 11);
  inner.setAttribute('class', 'handle-inner');

  const outer = document.createElementNS(SVG_NAMESPACE, 'rect');   
  outer.setAttribute('x', x - 6.5);
  outer.setAttribute('y', y - 6.5);
  outer.setAttribute('width', 13);
  outer.setAttribute('height', 13);
  outer.setAttribute('class', 'handle-outer');

  g.appendChild(outer);
  g.appendChild(inner);

  return g;
}

const setHandleXY = (handle, x, y) => {
  handle.setAttribute('transform-origin', `${x}px ${y}px`);

  const inner = handle.querySelector('.handle-inner');
  inner.setAttribute('x', x - 5.5);
  inner.setAttribute('y', y - 5.5);

  const outer = handle.querySelector('.handle-outer');
  outer.setAttribute('x', x - 6.5);
  outer.setAttribute('y', y - 6.5);
}

const stretchCorners = (corner, opposite) => {
  const x1 = corner.x;
  const y1 = corner.y;

  const x2 = opposite.x;
  const y2 = opposite.y;

  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  const w = Math.abs(x2 - x1);
  const h = Math.abs(y2 - y1);

  return { x, y, w, h };
}

/**
 * An editable rectangle shape.
 */
export default class EditableRect extends EventEmitter {

  constructor(annotation, g) {
    super();

    this.annotation = annotation;

    // SVG element
    this.svg = g.closest('svg');

    const { x, y, w, h } = parseRectFragment(annotation);

    // 'g' for the editable rect compound shape
    this.group = document.createElementNS(SVG_NAMESPACE, 'g');
    this.rectangle = drawRect(x, y, w, h);
    this.rectangle.setAttribute('class', 'a9s-annotation editable');
    this.group.appendChild(this.rectangle);

    this.rectangle.querySelector('.inner')
      .addEventListener('mousedown', this.onGrab(this.rectangle));
    
    this.svg.addEventListener('mousemove', this.onMouseMove);
    this.svg.addEventListener('mouseup', this.onMouseUp);

    this.handles = [
      [ x, y, 'topleft' ], 
      [ x + w, y, 'topright'], 
      [ x + w, y + h, 'bottomright' ], 
      [ x, y + h, 'bottomleft' ]
    ].map(t => { 
      const [ x, y, className ] = t;
      const handle = drawHandle(x, y, className);

      handle.addEventListener('mousedown', this.onGrab(handle));
      this.group.appendChild(handle);

      return handle;
    });

    g.appendChild(this.group);

    // The grabbed element (handle or entire group), if any
    this.grabbedElem = null; 

    // Mouse xy offset inside the shape, if mouse pressed
    this.mouseOffset = null;

    this.enableResponsive()
  }

  enableResponsive = () => {
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

  /** Sets the shape size, including handle positions **/
  setSize = (x, y, w, h) => {
    setRectSize(this.rectangle, x, y, w, h);

    const [ topleft, topright, bottomright, bottomleft] = this.handles;
    setHandleXY(topleft, x, y);
    setHandleXY(topright, x + w, y);
    setHandleXY(bottomright, x + w, y + h);
    setHandleXY(bottomleft, x, y + h);
  }

  /** Converts mouse coordinates to SVG coordinates **/
  getMousePosition = evt => {
    const pt = this.svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    return pt.matrixTransform(this.svg.getScreenCTM().inverse());
  }

  onGrab = grabbedElem => evt => {
    this.grabbedElem = grabbedElem; 
    const pos = this.getMousePosition(evt);
    const { x, y } = getRectSize(this.rectangle);
    this.mouseOffset = { x: pos.x - x, y: pos.y - y };  
  }

  onMouseMove = evt => {
    if (this.grabbedElem) {
      const pos = this.getMousePosition(evt);

      if (this.grabbedElem === this.rectangle) {
        // x/y changes by mouse offset, w/h remains unchanged
        const { w, h } = getRectSize(this.rectangle);
        const x = pos.x - this.mouseOffset.x;
        const y = pos.y - this.mouseOffset.y;

        this.setSize(x, y, w, h); 
        this.emit('update', { x, y, w, h }); 
      } else {
        // Handles
        const corners = getCorners(this.rectangle);

        // Mouse position replaces one of the corner coords, depending
        // on which handle is the grabbed element
        const handleIdx = this.handles.indexOf(this.grabbedElem);
        const oppositeCorner = handleIdx < 2 ? 
          corners[handleIdx + 2] : corners[handleIdx - 2];

        const { x, y, w, h } = stretchCorners(pos, oppositeCorner)

        this.setSize(x, y, w, h); 
        this.emit('update', { x, y, w, h }); 
      }
    }
  }

  onMouseUp = evt => {
    this.grabbedElem = null;
    this.mouseOffset = null;
  }

  getBoundingClientRect = () => 
    this.rectangle.getBoundingClientRect();

  destroy = () => {
    this.group.parentNode.removeChild(this.group);
    this.resizeObserver.disconnect();
    this.resizeObserver = null;
  }

}