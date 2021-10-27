import EditableShape from '../EditableShape';
import { SVG_NAMESPACE } from '../../util/SVG';
import { format, setFormatterElSize } from '../../util/Formatting';
import {
  drawRect,
  drawRectMask,
  parseRectFragment,
  getRectSize,
  setRectSize,
  toRectFragment,
  setRectMaskSize
} from '../../selectors/RectFragment';

/**
 * An editable rectangle shape.
 */
export default class EditableRect extends EditableShape {

  constructor(annotation, g, config, env) {
    super(annotation, g, config, env);

    this.svg.addEventListener('mousemove', this.onMouseMove);
    this.svg.addEventListener('mouseup', this.onMouseUp);

    const { x, y, w, h } = parseRectFragment(annotation, env.image);

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
    this.elementGroup.setAttribute('class', 'a9s-annotation editable selected');

    this.rectangle = drawRect(x, y, w, h);
    this.rectangle.querySelector('.a9s-inner')
      .addEventListener('mousedown', this.onGrab(this.rectangle));

    this.elementGroup.appendChild(this.rectangle);

    this.handles = [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h]
    ].map(t => {
      const [x, y] = t;
      const handle = this.drawHandle(x, y);

      handle.addEventListener('mousedown', this.onGrab(handle));
      this.elementGroup.appendChild(handle);

      return handle;
    });

    this.containerGroup.appendChild(this.elementGroup);

    g.appendChild(this.containerGroup);

    format(this.rectangle, annotation, config.formatter);

    // The grabbed element (handle or entire group), if any
    this.grabbedElem = null;

    // Mouse xy offset inside the shape, if mouse pressed
    this.mouseOffset = null;
  }

  onScaleChanged = () => 
    this.handles.map(this.scaleHandle);

  setSize = (x, y, w, h) => {
    setRectSize(this.rectangle, x, y, w, h);
    setRectMaskSize(this.mask, this.env.image, x, y, w, h);
    setFormatterElSize(this.elementGroup, x, y, w, h);

    const [topleft, topright, bottomright, bottomleft] = this.handles;
    this.setHandleXY(topleft, x, y);
    this.setHandleXY(topright, x + w, y);
    this.setHandleXY(bottomright, x + w, y + h);
    this.setHandleXY(bottomleft, x, y + h);
  }

  stretchCorners = (draggedHandleIdx, anchorHandle, mousePos) => {
    const anchor = this.getHandleXY(anchorHandle);

    const width = mousePos.x - anchor.x;
    const height = mousePos.y - anchor.y;

    const x = width > 0 ? anchor.x : mousePos.x;
    const y = height > 0 ? anchor.y : mousePos.y;
    const w = Math.abs(width);
    const h = Math.abs(height);

    setRectSize(this.rectangle, x, y, w, h);
    setRectMaskSize(this.mask, this.env.image, x, y, w, h);
    setFormatterElSize(this.elementGroup, x, y, w, h);

    // Anchor (=opposite handle) stays in place, dragged handle moves with mouse
    this.setHandleXY(this.handles[draggedHandleIdx], mousePos.x, mousePos.y);

    // Handles left and right of the dragged handle
    const left = this.handles[(draggedHandleIdx + 3) % 4];
    this.setHandleXY(left, anchor.x, mousePos.y);

    const right = this.handles[(draggedHandleIdx + 5) % 4];
    this.setHandleXY(right, mousePos.x, anchor.y);

    return { x, y, w, h };
  }

  onGrab = grabbedElem => evt => {
    if (evt.button !== 0) return;  // left click
    this.grabbedElem = grabbedElem;
    const pos = this.getSVGPoint(evt);
    const { x, y } = getRectSize(this.rectangle);
    this.mouseOffset = { x: pos.x - x, y: pos.y - y };
  }

  onMouseMove = evt => {
    if (evt.button !== 0) return;  // left click
    const constrain = (coord, max) =>
      coord < 0 ? 0 : (coord > max ? max : coord);

    if (this.grabbedElem) {
      const pos = this.getSVGPoint(evt);

      if (this.grabbedElem === this.rectangle) {
        // x/y changes by mouse offset, w/h remains unchanged
        const { w, h } = getRectSize(this.rectangle);

        const { naturalWidth, naturalHeight } = this.env.image;

        const x = constrain(pos.x - this.mouseOffset.x, naturalWidth - w);
        const y = constrain(pos.y - this.mouseOffset.y, naturalHeight - h);

        this.setSize(x, y, w, h);
        this.emit('update', toRectFragment(x, y, w, h, this.env.image, this.config.fragmentUnit));
      } else {
        // Mouse position replaces one of the corner coords, depending
        // on which handle is the grabbed element
        const handleIdx = this.handles.indexOf(this.grabbedElem);
        const oppositeHandle = handleIdx < 2 ?
          this.handles[handleIdx + 2] : this.handles[handleIdx - 2];

        const { x, y, w, h } = this.stretchCorners(handleIdx, oppositeHandle, pos);
        this.emit('update', toRectFragment(x, y, w, h, this.env.image, this.config.fragmentUnit));
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

  updateState = annotation => {
    const { x, y, w, h } = parseRectFragment(annotation, this.env.image);
    this.setSize(x, y, w, h);
  }

  destroy() {
    this.containerGroup.parentNode.removeChild(this.containerGroup);
    super.destroy();
  }

}
