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

const CORNER = 'corner';
const EDGE = 'edge';

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
    this.elementGroup.setAttribute('data-id', annotation.id);

    this.rectangle = drawRect(x, y, w, h);
    this.rectangle.querySelector('.a9s-inner')
      .addEventListener('mousedown', this.onGrab(this.rectangle));

    this.elementGroup.appendChild(this.rectangle);

    this.enableEdgeControls = config.enableEdgeControls;

    const edgeHandles = this.enableEdgeControls
    ? [
        [x + w / 2, y, EDGE],
        [x + w, y + h / 2, EDGE],
        [x + w / 2, y + h, EDGE],
        [x, y + h / 2, EDGE],
      ]
    : [];

    this.handles = [
      [x, y, CORNER],
      [x + w, y, CORNER],
      [x + w, y + h, CORNER],
      [x, y + h, CORNER],
      ...edgeHandles,
    ].map(t => {
      const [x, y, type] = t;
      const handle = this.drawHandle(x, y);

      handle.addEventListener('mousedown', this.onGrab(handle, type));
      this.elementGroup.appendChild(handle);

      return handle;
    });

    this.containerGroup.appendChild(this.elementGroup);

    g.appendChild(this.containerGroup);

    format(this.rectangle, annotation, config.formatters);

    // The grabbed element (handle or entire group), if any
    this.grabbedElem = null;
    
    // Type of the grabbed element, either 'corner' or 'edge'
    this.grabbedType = null;

    // Mouse xy offset inside the shape, if mouse pressed
    this.mouseOffset = null;
  }

  onScaleChanged = () => 
    this.handles.map(this.scaleHandle);

  setSize = (x, y, w, h) => {
    setRectSize(this.rectangle, x, y, w, h);
    setRectMaskSize(this.mask, this.env.image, x, y, w, h);
    setFormatterElSize(this.elementGroup, x, y, w, h);

    const [
      topleft,
      topright,
      bottomright,
      bottomleft,
      topEdge,
      rightEdge,
      bottomEdge,
      leftEdge
    ] = this.handles;

    this.setHandleXY(topleft, x, y);
    this.setHandleXY(topright, x + w, y);
    this.setHandleXY(bottomright, x + w, y + h);
    this.setHandleXY(bottomleft, x, y + h);

    if (this.enableEdgeControls) {
      this.setHandleXY(topEdge, x + w / 2, y);
      this.setHandleXY(rightEdge, x + w, y + h / 2);
      this.setHandleXY(bottomEdge, x + w / 2, y + h);
      this.setHandleXY(leftEdge, x, y + h / 2);
    }
  }

  stretchCorners = (draggedHandleIdx, anchorHandle, mousePos) => {
    const anchor = this.getHandleXY(anchorHandle);

    const width = mousePos.x - anchor.x;
    const height = mousePos.y - anchor.y;

    const x = width > 0 ? anchor.x : mousePos.x;
    const y = height > 0 ? anchor.y : mousePos.y;
    const w = Math.abs(width);
    const h = Math.abs(height);

    this.setSize(x, y, w, h);

    return { x, y, w, h };
  }

  stretchEdge = (handleIdx, oppositeHandle, mousePos) => {
    const anchor = this.getHandleXY(oppositeHandle);
    const currentRectDims = getRectSize(this.rectangle);
    const isHeightAdjustment = handleIdx % 2 === 0;

    const width = isHeightAdjustment ? currentRectDims.w : mousePos.x - anchor.x;
    const height = isHeightAdjustment ? mousePos.y - anchor.y : currentRectDims.h;

    const x = isHeightAdjustment ? currentRectDims.x : (width > 0 ? anchor.x : mousePos.x);
    const y = isHeightAdjustment ? (height > 0 ? anchor.y : mousePos.y) : currentRectDims.y;
    const w = Math.abs(width);
    const h = Math.abs(height);

    this.setSize(x, y, w, h);

    return { x, y, w, h };
  };

  onGrab = (grabbedElem, type) => evt => {
    if (evt.button !== 0) return;  // left click
    this.grabbedElem = grabbedElem;
    this.grabbedType = type;
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
        const oppositeHandle = this.handles[handleIdx ^ 2];

        const { x, y, w, h } = 
          this.grabbedType === CORNER
          ? this.stretchCorners(handleIdx, oppositeHandle, pos)
          : this.stretchEdge(handleIdx, oppositeHandle, pos);

        this.emit('update', toRectFragment(x, y, w, h, this.env.image, this.config.fragmentUnit));
      }
    }
  }

  onMouseUp = evt => {
    this.grabbedElem = null;
    this.grabbedType = null;
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
