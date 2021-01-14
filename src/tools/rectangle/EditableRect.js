import EventEmitter from 'tiny-emitter';
import { SVG_NAMESPACE } from '../../util/SVG';
import { format } from '../../util/Formatting';
import { 
  drawRect, 
  drawRectMask,
  getCorners, 
  parseRectFragment,
  getRectSize, 
  setRectSize, 
  toRectFragment, 
  setRectMaskSize
} from '../../selectors/RectFragment';

// draw circle point at (x, y)
const drawHandle = (x, y) => {
  const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
  svg.setAttribute('class', 'a9s-handle');
  svg.setAttribute('overflow', 'visible');
  svg.setAttribute('x', x);
  svg.setAttribute('y', y);

  const group = document.createElementNS(SVG_NAMESPACE, 'g');

  const drawCircle = r => {
    const c = document.createElementNS(SVG_NAMESPACE, 'circle');
    c.setAttribute('cx', 0);
    c.setAttribute('cy', 0);
    c.setAttribute('r', r);
    return c;
  }

  const inner = drawCircle(6);
  inner.setAttribute('class', 'a9s-handle-inner')

  const outer = drawCircle(7);
  outer.setAttribute('class', 'a9s-handle-outer')

  group.appendChild(outer);
  group.appendChild(inner);

  svg.appendChild(group);
  return svg;
}

const setHandleXY = (handle, x, y) => {
  handle.setAttribute('x', x);
  handle.setAttribute('y', y);
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

  constructor(annotation, g, config, env) {
    super();

    this.annotation = annotation;
    this.env = env;
    // SVG element
    this.svg = g.closest('svg');
    this.g = g;

    this.svg.addEventListener('mousemove', this.onMouseMove);
    this.svg.addEventListener('mouseup', this.onMouseUp);

    const { x, y, w, h } = parseRectFragment(annotation);

    // SVG markup for this class looks like this:
    // 
    // <g>
    //   <path class="a9s-selection mask"... />
    //   <g> <-- return this node as .element
    //     <rect class="a9s-outer" ... />
    //     <rect class="a9s-inner" ... />
    //     <g class="a9s-handle" ...> ... </g>
    //     <g class="a9s-handle" ...> ... </g>
    //     <g class="a9s-handle" ...> ... </g>
    //     <g class="a9s-handle" ...> ... </g>
    //   </g> 
    // </g>

    // 'g' for the editable rect compound shape
    this.containerGroup = document.createElementNS(SVG_NAMESPACE, 'g');

    this.mask = drawRectMask(env.image, x, y, w, h);
    this.mask.setAttribute('class', 'a9s-selection-mask');
    this.containerGroup.appendChild(this.mask);

    // The 'element' = rectangles + handles
    this.elementGroup = document.createElementNS(SVG_NAMESPACE, 'g');

    this.rectangle = drawRect(x, y, w, h);
    this.rectangle.setAttribute('class', 'a9s-annotation editable selected');
    this.rectangle.querySelector('.a9s-inner')
      .addEventListener('mousedown', this.onGrab(this.rectangle));

    format(this.rectangle, annotation, config.formatter);

    this.elementGroup.appendChild(this.rectangle);    

    this.handles = [
      [ x, y ],
      [ x + w, y ],
      [ x + w, y + h ],
      [ x, y + h ]
    ].map(t => { 
      const [ x, y ] = t;
      const handle = drawHandle(x, y);

      handle.addEventListener('mousedown', this.onGrab(handle));
      this.elementGroup.appendChild(handle);

      return handle;
    });

    this.containerGroup.appendChild(this.elementGroup);

    g.appendChild(this.containerGroup);

    // The grabbed element (handle or entire group), if any
    this.grabbedElem = null; 

    // Mouse xy offset inside the shape, if mouse pressed
    this.mouseOffset = null;

    // Bit of a hack. If we are dealing with a 'real' image, we enable
    // reponsive mode. OpenSeadragon handles scaling in a different way,
    // so we don't need responsive mode.
    const { image } = env;
    if (image instanceof Element || image instanceof HTMLDocument)
      this.enableResponsive();
  }

  /**
   * Not really needed (could just define a this.element).
   * But to make this more explicit: element is a field every
   * editable shape implementation must provide
   */
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

  /** Sets the shape size, including handle positions **/
  setSize = (x, y, w, h) => {
    setRectSize(this.rectangle, x, y, w, h);
    setRectMaskSize(this.mask, this.env.image, x, y, w, h);

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
    return pt.matrixTransform(this.g.getScreenCTM().inverse());
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
        this.emit('update', toRectFragment(x, y, w, h, this.env.image)); 
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
        this.emit('update', toRectFragment(x, y, w, h, this.env.image)); 
      }
    }
  }

  onMouseUp = evt => {
    this.grabbedElem = null;
    this.mouseOffset = null;
  }

  destroy = () => {
    this.containerGroup.parentNode.removeChild(this.containerGroup);

    if (this.resizeObserver)
      this.resizeObserver.disconnect();
    
    this.resizeObserver = null;
  }

}