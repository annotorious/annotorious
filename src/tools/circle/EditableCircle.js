import EditableShape from '../EditableShape';
import { drawEmbeddedSVG, toSVGTarget } from '../../selectors/EmbeddedSVG';
import { SVG_NAMESPACE } from '../../util/SVG';
import { format, setFormatterElSize } from '../../util/Formatting';
import { getCircleSize, setCircleSize } from './Circle';
import Mask from './CircleMask';

/**
 * An editable circle shape.
 */
export default class EditableCircle extends EditableShape {

  constructor(annotation, g, config, env) {
    super(annotation, g, config, env);

    this.svg.addEventListener('mousemove', this.onMouseMove);
    this.svg.addEventListener('mouseup', this.onMouseUp);

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

    this.circle = drawEmbeddedSVG(annotation);
    this.circle.querySelector('.a9s-inner')
      .addEventListener('mousedown', this.onGrab(this.circle));

    this.mask = new Mask(env.image, this.circle);

    this.containerGroup.appendChild(this.mask.element);

    // The 'element' = circle + handles
    this.elementGroup = document.createElementNS(SVG_NAMESPACE, 'g');
    this.elementGroup.setAttribute('class', 'a9s-annotation editable selected');
    this.elementGroup.appendChild(this.circle);    

    const { cx, cy, r } = getCircleSize(this.circle);

    this.handles = [
      [ cx, cy - r ],
      [ cx + r, cy ],
      [ cx, cy + r ],
      [ cx - r, cy ]
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
    this.grabbedAt = null;
  }

  setSize = (cx, cy, r) => {
    setCircleSize(this.circle, cx, cy, r);
    this.mask.redraw();
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
    var width = 0;
    var height = 0;
    var r;
    if (draggedHandleIdx == 0 || draggedHandleIdx == 2) {
      mouseX = anchor.x;
      height = mouseY - anchor.y;
      r = Math.abs(height) / 2;
    } else {
      mouseY = anchor.y;
      width = mouseX - anchor.x;
      r = Math.abs(width) / 2;
    }

    const x = width > 0 ? anchor.x : mouseX;
    const y = height > 0 ? anchor.y : mouseY;
    const w = Math.abs(width);
    const h = Math.abs(height);
    const cx = x + w/2;
    const cy = y + h/2;

    setCircleSize(this.circle, cx, cy, r);
    this.mask.redraw();
    setFormatterElSize(this.elementGroup, cx, cy, r, r);

    if (draggedHandleIdx == 0 || draggedHandleIdx == 2) {
      var idx0 = 0;
      var idx2 = 2;
      if(draggedHandleIdx == 0 && height > 0 || draggedHandleIdx == 2 && height < 0) {
        idx0 = 2;
        idx2 = 0;
      }
      this.setHandleXY(this.handles[idx0], cx, cy - r);
      this.setHandleXY(this.handles[idx2], cx, cy + r);
      this.setHandleXY(this.handles[1], cx + r, cy);
      this.setHandleXY(this.handles[3], cx - r, cy);
    } else {
      var idx3 = 3;
      var idx1 = 1;
      if (draggedHandleIdx == 1 && width > 0 || draggedHandleIdx == 3 && width < 0) {
        idx3 = 1;
        idx1 = 3;
      }
      this.setHandleXY(this.handles[idx3], cx + r, cy);
      this.setHandleXY(this.handles[idx1], cx - r, cy);
      this.setHandleXY(this.handles[0], cx, cy - r);
      this.setHandleXY(this.handles[2], cx, cy + r);
    }
  }

  onGrab = grabbedElem => evt => {
    this.grabbedElem = grabbedElem; 
    
    const pos = this.getSVGPoint(evt);
    const { cx, cy } = getCircleSize(this.circle);
    
    this.grabbedAt = { x: pos.x - cx, y: pos.y - cy };
  }

  onMouseMove = evt => {
    const constrain = (coord, max) =>
      coord < 0 ? 0 : ( coord > max ? max : coord);

    if (this.grabbedElem) {
      const pos = this.getSVGPoint(evt);

      if (this.grabbedElem === this.circle) {
        const { r } = getCircleSize(this.circle);

        const { naturalWidth, naturalHeight } = this.env.image;

        const cx = constrain(pos.x - this.grabbedAt.x, naturalWidth - r);
        const cy = constrain(pos.y - this.grabbedAt.y, naturalHeight - r);

        this.setSize(cx, cy, r); 
        this.emit('update', toSVGTarget(this.circle, this.env.image)); 
      } else {
        // Mouse position replaces one of the corner coords, depending
        // on which handle is the grabbed element
        const handleIdx = this.handles.indexOf(this.grabbedElem);
        const oppositeHandle = handleIdx < 2 ? 
          this.handles[handleIdx + 2] : this.handles[handleIdx - 2];

        this.stretchCorners(handleIdx, oppositeHandle, pos);
        this.emit('update', toSVGTarget(this.circle, this.env.image));
      }
    }
  }

  onMouseUp = () => {
    this.grabbedElem = null;
    this.grabbedAt = null;
  }

  get element() { 
    return this.elementGroup; 
  }

  destroy() {
    this.containerGroup.parentNode.removeChild(this.containerGroup);
    super.destroy();
  }

}
