import EditableShape from '../EditableShape';
import { SVG_NAMESPACE } from '../../util/SVG';
import { format, setFormatterElSize } from '../../util/Formatting';
import { 
  drawCircle,
  drawCircleMask,
  parseCircleFragment,
  getCircleSize,
  setCircleSize,
  toCircleFragment,
  setCircleMaskSize
} from '../../selectors/CircleFragment';

/**
 * An editable circle shape.
 */
export default class EditableCircle extends EditableShape {

  constructor(annotation, g, config, env) {
    super(annotation, g, config, env);

    this.svg.addEventListener('mousemove', this.onMouseMove);
    this.svg.addEventListener('mouseup', this.onMouseUp);

    const { cx, cy, r } = parseCircleFragment(annotation);

    // SVG markup for this class looks like this:
    // 
    // <g>
    //   <path class="a9s-selection mask"... />
    //   <g> <-- return this node as .element
    //     <circle class="a9s-outer" ... />
    //     <circle class="a9s-inner" ... />
    //     <g class="a9s-handle" ...> ... </g>
    //     <g class="a9s-handle" ...> ... </g>
    //     <g class="a9s-handle" ...> ... </g>
    //     <g class="a9s-handle" ...> ... </g>
    //   </g> 
    // </g>

    // 'g' for the editable circle compound shape
    this.containerGroup = document.createElementNS(SVG_NAMESPACE, 'g');

    this.mask = drawCircleMask(env.image, cx, cy, r);
    this.mask.setAttribute('class', 'a9s-selection-mask');
    this.containerGroup.appendChild(this.mask);

    // The 'element' = circle + handles
    this.elementGroup = document.createElementNS(SVG_NAMESPACE, 'g');
    this.elementGroup.setAttribute('class', 'a9s-annotation editable selected');

    this.circle = drawCircle(cx, cy, r);
    this.circle.querySelector('.a9s-inner')
      .addEventListener('mousedown', this.onGrab(this.circle));

    this.elementGroup.appendChild(this.circle);    

    this.handles = [
      [cx, cy - r],
      [cx + r, cy],
      [cx, cy + r],
      [cx - r, cy]
    ].map(t => { 
      const [ x, y ] = t;
      const handle = this.drawHandle(x, y);

      handle.addEventListener('mousedown', this.onGrab(handle));
      this.elementGroup.appendChild(handle);

      return handle;
    });

    this.containerGroup.appendChild(this.elementGroup);

    g.appendChild(this.containerGroup);

    format(this.circle, annotation, config.formatter);

    // The grabbed element (handle or entire group), if any
    this.grabbedElem = null; 

    // Mouse xy offset inside the shape, if mouse pressed
    this.mouseOffset = null;
  }

  setSize = (cx, cy, r) => {
    setCircleSize(this.circle, cx, cy, r);
    setCircleMaskSize(this.mask, this.env.image, cx, cy, r);
    setFormatterElSize(this.elementGroup, cx, cy, r, r);

    const [ topleft, topright, bottomright, bottomleft] = this.handles;
    this.setHandleXY(topleft, cx, cy - r);
    this.setHandleXY(topright, cx + r, cy);
    this.setHandleXY(bottomright, cx, cy + r);
    this.setHandleXY(bottomleft, cx - r, cy);
  }

  stretchCorners = (draggedHandleIdx, anchorHandle, mousePos) => {
    const anchor = this.getHandleXY(anchorHandle);

    var mouseX = mousePos.x;
    var mouseY = mousePos.y;
    if(draggedHandleIdx == 0 || draggedHandleIdx == 2) {
      mouseX = anchor.x;
    } else {
      mouseY = anchor.y;
    }

    const width = mouseX - anchor.x;
    const height = mouseY - anchor.y;

    const x = width > 0 ? anchor.x : mouseX;
    const y = height > 0 ? anchor.y : mouseY;
    const w = Math.abs(width);
    const h = Math.abs(height);
    const cx = x + w/2;
    const cy = y + h/2;
    const r = Math.pow(w**2 + h**2, 0.5)/2;

    setCircleSize(this.circle, cx, cy, r);
    setCircleMaskSize(this.mask, this.env.image, cx, cy, r);
    setFormatterElSize(this.elementGroup, cx, cy, r, r);

    if(draggedHandleIdx != 2) {
      this.setHandleXY(this.handles[0], cx, cy - r);
    }
    if(draggedHandleIdx != 3) {
      this.setHandleXY(this.handles[1], cx + r, cy);
    }
    if(draggedHandleIdx != 0) {
      this.setHandleXY(this.handles[2], cx, cy + r);
    }
    if(draggedHandleIdx != 1) {
      this.setHandleXY(this.handles[3], cx - r, cy);
    }

    return { cx, cy, r };
  }

  onGrab = grabbedElem => evt => {
    this.grabbedElem = grabbedElem; 
    const pos = this.getSVGPoint(evt);
    const { cx, cy } = getCircleSize(this.circle);
    this.mouseOffset = { x: pos.x - cx, y: pos.y - cy };  
  }

  onMouseMove = evt => {
    const constrain = (coord, max) =>
      coord < 0 ? 0 : ( coord > max ? max : coord);

    if (this.grabbedElem) {
      const pos = this.getSVGPoint(evt);

      if (this.grabbedElem === this.circle) {
        // x/y changes by mouse offset, w/h remains unchanged
        const { r } = getCircleSize(this.circle);

        const { naturalWidth, naturalHeight } = this.env.image;

        const cx = constrain(pos.x - this.mouseOffset.x, naturalWidth - r);
        const cy = constrain(pos.y - this.mouseOffset.y, naturalHeight - r);

        this.setSize(cx, cy, r); 
        this.emit('update', toCircleFragment(cx, cy, r, this.env.image)); 
      } else {
        // Mouse position replaces one of the corner coords, depending
        // on which handle is the grabbed element
        const handleIdx = this.handles.indexOf(this.grabbedElem);
        const oppositeHandle = handleIdx < 2 ? 
          this.handles[handleIdx + 2] : this.handles[handleIdx - 2];

        const { cx, cy, r } = this.stretchCorners(handleIdx, oppositeHandle, pos);
        this.emit('update', toCircleFragment(cx, cy, r, this.env.image));
      }
    }
  }

  onMouseUp = evt => {
    this.grabbedElem = null;
    this.mouseOffset = null;
  }

  get element() { 
    return this.elementGroup; 
  }

  destroy() {
    this.containerGroup.parentNode.removeChild(this.containerGroup);
    super.destroy();
  }

}
