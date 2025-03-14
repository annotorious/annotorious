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

const HANDLE = 'handle';
const EDGE = 'edge';

const DEFAULT_EDGE_PADDING = 5;
const DEFAULT_HANDLE_PADDING = 10;

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
    //     <rect class="a9s-edge" ... /> (x4)
    //     <g class="a9s-handle" ...> ... </g> (x4)
    //   </g>
    // </g>

    // 'g' for the editable rect compound shape
    this.containerGroup = document.createElementNS(SVG_NAMESPACE, 'g');

    this.mask = drawRectMask(env.image, x, y, w, h);
    this.mask.setAttribute('class', 'a9s-selection-mask');
    this.containerGroup.appendChild(this.mask);

    // The 'element' = rectangles + handles + edges
    this.elementGroup = document.createElementNS(SVG_NAMESPACE, 'g');
    this.elementGroup.setAttribute('class', 'a9s-annotation editable selected');
    this.elementGroup.setAttribute('data-id', annotation.id);

    this.rectangle = drawRect(x, y, w, h);
    this.rectangle
      .querySelector('.a9s-inner')
      .addEventListener('mousedown', this.onGrab(this.rectangle));

    this.elementGroup.appendChild(this.rectangle);

    // Add edge padding for resizing
    this.edgePadding = this.createEdgePadding(x, y, w, h);

    this.edgePadding.forEach(edge => {
      this.elementGroup.appendChild(edge);
      edge.addEventListener('mousedown', this.onGrab(edge, EDGE));
    });

    // Create corner handles
    this.handles = [
      [x, y, HANDLE],
      [x + w, y, HANDLE],
      [x + w, y + h, HANDLE],
      [x, y + h, HANDLE],
    ].map((t, i) => {
      const [x, y, type] = t;
      const handle = this.drawHandle(x, y);
      const handleInner = handle.querySelector('.a9s-handle-inner');

      // The circles are rendered in clockwise direction
      // So 0 and 2 show nwse-resize and 1 and 3 show nesw-resize as cursor
      if (i % 2 === 0) {
        handleInner.style.cursor = 'nwse-resize';
      } else {
        handleInner.style.cursor = 'nesw-resize';
      }

      handle.addEventListener('mousedown', this.onGrab(handle, type));
      this.elementGroup.appendChild(handle);

      return handle;
    });

    this.handlePads = this.createHandlePads(x, y, w, h);

    // Attaching the mouse down event to the handle pads
    this.handlePads.forEach((pad, i) => {
      pad.addEventListener('mousedown', (evt) => {
        this.onGrab(this.handles[i], HANDLE)(evt);
      });
      this.elementGroup.appendChild(pad);
    });

    this.containerGroup.appendChild(this.elementGroup);

    g.appendChild(this.containerGroup);

    format(this.rectangle, annotation, config.formatters);

    // The grabbed element (handle, edge or entire group), if any
    this.grabbedElem = null;

    // Type of the grabbed element, either 'handle' or 'edge'
    this.grabbedType = null;

    // Mouse xy offset inside the shape, if mouse pressed
    this.mouseOffset = null;

    this.svgRoot = this.svg.closest('svg');
  }

  calculateEdgePadding = () => {
    // const basePadding = this.config.edgePadding ?? DEFAULT_EDGE_PADDING;

    // let scaleFactor;
    // if (this.scale < 0.5) {
    //   // When zoomed in deeply, we increase the padding slightly to make resizing easier.
    //   scaleFactor = this.scale * 2;
    // } else {
    //   scaleFactor = this.scale;
    // }

    // const edgeResizePadding = basePadding * scaleFactor;
    // return Math.max(edgeResizePadding, 1);
    return 3;
  }

  calculateHandlePadding = () => {
    // const basePadding = this.config.handlePadding ?? DEFAULT_HANDLE_PADDING;

    // let scaleFactor;
    // if (this.scale < 0.5) {
    //   // When zoomed in deeply, we increase the padding slightly to make resizing easier
    //   scaleFactor = this.scale * 2;
    // } else {
    //   scaleFactor = this.scale / 2;
    // }

    // const scaledPadSize = basePadding * scaleFactor;
    // return Math.max(scaledPadSize, 1);
    return 5;
  }

  createEdgePadding(x, y, w, h) {
    const edgeResizePadding = this.calculateEdgePadding();

    return [
      // top edge
      this.createLine(x, y, x + w, y, 'ns-resize', 'top'),
      // right edge
      this.createLine(x + w, y, x + w, y + h, 'ew-resize', 'right'),
      // bottom edge
      this.createLine(x, y + h, x + w, y + h, 'ns-resize', 'bottom'),
      // left edge
      this.createLine(x, y, x, y + h, 'ew-resize', 'left')
    ];

    // return [
    //   // Edges are drawn from top to bottom and left to right
    //   this.createEdge(
    //     x,
    //     y - edgeResizePadding,
    //     w,
    //     2 * edgeResizePadding,
    //     'ns-resize',
    //     'top'
    //   ),
    //   this.createEdge(
    //     x + w - edgeResizePadding,
    //     y,
    //     2 * edgeResizePadding,
    //     h,
    //     'ew-resize',
    //     'right'
    //   ),
    //   this.createEdge(
    //     x,
    //     y + h - edgeResizePadding,
    //     w,
    //     2 * edgeResizePadding,
    //     'ns-resize',
    //     'bottom'
    //   ),
    //   this.createEdge(
    //     x - edgeResizePadding,
    //     y,
    //     2 * edgeResizePadding,
    //     h,
    //     'ew-resize',
    //     'left'
    //   )
    // ];
  }

  createEdge(x, y, width, height, cursor, position) {
    const edge = document.createElementNS(SVG_NAMESPACE, 'rect');
    edge.setAttribute('x', x);
    edge.setAttribute('y', y);
    edge.setAttribute('width', width);
    edge.setAttribute('height', height);
    edge.setAttribute('class', `a9s-edge ${position}`);
    edge.style.fill = 'blue';
    edge.style.cursor = cursor;
    return edge;
  }

  createLine(x1, y1, x2, y2, cursor, position) {
    const edgePadding = document.createElementNS(SVG_NAMESPACE, 'line');
    edgePadding.setAttribute('x1', x1);
    edgePadding.setAttribute('y1', y1);
    edgePadding.setAttribute('x2', x2);
    edgePadding.setAttribute('y2', y2);
    edgePadding.setAttribute('class', `a9s-edge-pad ${position}`);
    edgePadding.style.cursor = cursor;
    edgePadding.style.stroke = 'blue';
    edgePadding.setAttribute('stroke-width', 5)
    return edgePadding;
  }

  createHandlePads(x, y, w, h) {
    const scaledPadSize = this.calculateHandlePadding();
    const radius = scaledPadSize;

    return [
      this.createHandlePad(x, y, radius, 'nwse-resize'), // top left
      this.createHandlePad(x + w, y, radius, 'nesw-resize'), // top right
      this.createHandlePad(x + w, y + h, radius, 'nwse-resize'), // bottom right
      this.createHandlePad(x, y + h, radius, 'nesw-resize') // bottom left
    ];
  }

  createHandlePad(x, y, radius, cursor) {
    const handlePad = document.createElementNS(SVG_NAMESPACE, 'circle');
    handlePad.setAttribute('cx', x);
    handlePad.setAttribute('cy', y);
    handlePad.setAttribute('r', radius);
    handlePad.setAttribute('class', 'a9s-handle-pad');
    handlePad.style.fill = 'red';
    handlePad.style.cursor = cursor;
    return handlePad;
  }

  onScaleChanged = () =>
    this.handles.map(this.scaleHandle);

  updateEdgePositions() {
    const edgeResizePadding = this.calculateEdgePadding();
    const { x, y, w, h } = getRectSize(this.rectangle);
    const [top, right, bottom, left] = this.edgePadding;

    top.setAttribute('x', x);
    top.setAttribute('y', y - edgeResizePadding);
    top.setAttribute('width', w);
    top.setAttribute('height', 2 * edgeResizePadding);

    right.setAttribute('x', x + w - edgeResizePadding);
    right.setAttribute('y', y);
    right.setAttribute('width', 2 * edgeResizePadding);
    right.setAttribute('height', h);

    bottom.setAttribute('x', x);
    bottom.setAttribute('y', y + h - edgeResizePadding);
    bottom.setAttribute('width', w);
    bottom.setAttribute('height', 2 * edgeResizePadding);

    left.setAttribute('x', x - edgeResizePadding);
    left.setAttribute('y', y);
    left.setAttribute('width', 2 * edgeResizePadding);
    left.setAttribute('height', h);
  }

  updateEdgePadPositions() {
    const { x, y, w, h } = getRectSize(this.rectangle);
    const [top, right, bottom, left] = this.edgePadding;
  
    top.setAttribute('x1', x);
    top.setAttribute('y1', y);
    top.setAttribute('x2', x + w);
    top.setAttribute('y2', y);
  
    right.setAttribute('x1', x + w);
    right.setAttribute('y1', y);
    right.setAttribute('x2', x + w);
    right.setAttribute('y2', y + h);
  
    bottom.setAttribute('x1', x);
    bottom.setAttribute('y1', y + h);
    bottom.setAttribute('x2', x + w);
    bottom.setAttribute('y2', y + h);
  
    left.setAttribute('x1', x);
    left.setAttribute('y1', y);
    left.setAttribute('x2', x);
    left.setAttribute('y2', y + h);
  }
  

  updateHandlePadPositions = () => {
    const { x, y, w, h } = getRectSize(this.rectangle);
    const scaledPadSize = this.calculateHandlePadding();
    const radius = scaledPadSize;
    const [topLeft, topRight, bottomRight, bottomLeft] = this.handlePads;
    topLeft.setAttribute('cx', x);
    topLeft.setAttribute('cy', y);
    topLeft.setAttribute('r', radius);

    topRight.setAttribute('cx', x + w);
    topRight.setAttribute('cy', y);
    topRight.setAttribute('r', radius);

    bottomRight.setAttribute('cx', x + w);
    bottomRight.setAttribute('cy', y + h);
    bottomRight.setAttribute('r', radius);

    bottomLeft.setAttribute('cx', x);
    bottomLeft.setAttribute('cy', y + h);
    bottomLeft.setAttribute('r', radius);
  }

  setSize = (x, y, w, h) => {
    setRectSize(this.rectangle, x, y, w, h);
    setRectMaskSize(this.mask, this.env.image, x, y, w, h);
    setFormatterElSize(this.elementGroup, x, y, w, h);

    // Update handle positions
    const [topleft, topright, bottomright, bottomleft] = this.handles;
    this.setHandleXY(topleft, x, y);
    this.setHandleXY(topright, x + w, y);
    this.setHandleXY(bottomright, x + w, y + h);
    this.setHandleXY(bottomleft, x, y + h);

    this.updateEdgePadPositions();
    this.updateHandlePadPositions();
  }

  stretchHandles = (draggedHandleIdx, anchorHandle, mousePos) => {
    const anchor = this.getHandleXY(anchorHandle);

    const width = mousePos.x - anchor.x;
    const height = mousePos.y - anchor.y;

    const x = width > 0 ? anchor.x : mousePos.x;
    const y = height > 0 ? anchor.y : mousePos.y;
    const w = Math.max(1, Math.abs(width));
    const h = Math.max(1, Math.abs(height));

    this.setSize(x, y, w, h);

    return { x, y, w, h };
  }

  stretchEdge = (edge, mousePos) => {
    const currentRectDims = getRectSize(this.rectangle);
    const edgePosition = edge.getAttribute('class').split(' ')[1];

    let { x, y, w, h } = currentRectDims;
    switch (edgePosition) {
      case 'top':
        h = y + h - mousePos.y;
        if (h < 1) {
          h = 1;
        }
        y = mousePos.y;
        break;
      case 'right':
        w = mousePos.x - x;
        if (w < 1) {
          w = 1;
        }
        break;
      case 'bottom':
        h = mousePos.y - y;
        if (h < 1) {
          h = 1;
        }
        break;
      case 'left':
        w = x + w - mousePos.x;
        if (w < 1) {
          w = 1;
        }
        x = mousePos.x;
        break;
    }

    this.setSize(x, y, w, h);
    return { x, y, w, h };
  }

  onGrab = (grabbedElem, type) => evt => {
    if (evt.button !== 0) return;  // left click

    evt.stopPropagation();

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
        this.emit(
          'update',
          toRectFragment(x, y, w, h, this.env.image, this.config.fragmentUnit)
        );
      } else if (this.grabbedType === HANDLE) {
        // Mouse position replaces one of the handle coords, depending
        // on which handle is the grabbed element
        const handleIdx = this.handles.indexOf(this.grabbedElem);
        const oppositeHandle = this.handles[handleIdx ^ 2];

        const { x, y, w, h } = this.stretchHandles(
          handleIdx,
          oppositeHandle,
          pos
        );

        this.emit(
          'update',
          toRectFragment(x, y, w, h, this.env.image, this.config.fragmentUnit)
        );
      } else if (this.grabbedType === EDGE) {
        const { x, y, w, h } = this.stretchEdge(this.grabbedElem, pos);

        this.emit(
          'update',
          toRectFragment(x, y, w, h, this.env.image, this.config.fragmentUnit)
        );
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