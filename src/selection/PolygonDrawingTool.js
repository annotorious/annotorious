import EventEmitter from 'tiny-emitter';
import { Selection } from '@recogito/recogito-client-core';
import { SVG_NAMESPACE } from '../SVGConst';
import { toSVGTarget } from '../annotations/selectors/EmbeddedSVG';

class RubberbandPolygon {

  constructor(anchor, g) {
    this.g = document.createElementNS(SVG_NAMESPACE, 'g');
    this.g.setAttribute('class', 'a9s-selection');

    this.outer = document.createElementNS(SVG_NAMESPACE, 'polygon');
    this.outer.setAttribute('class', 'outer');

    this.inner = document.createElementNS(SVG_NAMESPACE, 'polygon');
    this.inner.setAttribute('class', 'inner');

    this.points = [ anchor, anchor ];

    this.setPoints(this.points);

    this.g.appendChild(this.outer);
    this.g.appendChild(this.inner);

    this.isCollapsed = true;

    g.appendChild(this.g);
  }

  setPoints = points => {
    const attr = points.map(t => `${t[0]},${t[1]}`).join(' ');
    this.outer.setAttribute('points', attr);
    this.inner.setAttribute('points', attr);
  }

  dragTo = xy => {
    this.isCollapsed = false;

    const head = this.points.slice(0, this.points.length - 1);
    const rubberband = [ ...head, xy, head[0] ];
    this.setPoints(rubberband);
  }

  addPoint = xy => {
    const head = this.points.slice(0, this.points.length - 1);
    this.points = [ ...head, xy, head[0] ];
    this.setPoints(this.points);   
  }

  destroy = () => {

  }

  toSelection = () => {
    return new Selection(toSVGTarget(this.g));
  }

}

/**
 * A rubberband selector for rectangle fragments.
 */
export default class PolygonDrawingTool extends EventEmitter {

  constructor(g) {
    super();

    this.svg = g.closest('svg');
    this.g = g;
  }

  _attachListeners = () => {
    this.svg.addEventListener('mousemove', this.onMouseMove);  
    this.svg.addEventListener('dblclick', this.onDblClick);  
    document.addEventListener('mouseup', this.onMouseUp);
  }

  _detachListeners = () => {
    this.svg.removeEventListener('mousemove', this.onMouseMove);
    this.svg.removeEventListener('dblclick', this.onDblClick);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  _toSVG = (x, y) => {
    const pt = this.svg.createSVGPoint();

    const { left, top } = this.svg.getBoundingClientRect();
    pt.x = x + left;
    pt.y = y + top;

    return pt.matrixTransform(this.g.getScreenCTM().inverse());
  }

  startDrawing = evt => {
    const { x, y } = this._toSVG(evt.layerX, evt.layerY);
    this._attachListeners();
    this.rubberband = new RubberbandPolygon([ x, y ], this.g);
  }

  stop = () => {
    this._detachListeners();
    this.rubberband = null;
  }

  onMouseMove = evt => {
    const { x , y } = this._toSVG(evt.layerX, evt.layerY);
    this.rubberband.dragTo([ x, y ]);
  }

  onMouseUp = evt => {
    if (this.rubberband.isCollapsed) {
      this.emit('cancel', evt);
      this.stop();
    } else {
      const { x , y } = this._toSVG(evt.layerX, evt.layerY);
      this.rubberband.addPoint([ x, y ]);
    }
  }

  onDblClick = evt => {
    const { x , y } = this._toSVG(evt.layerX, evt.layerY);
    this.rubberband.addPoint([ x, y ]);

    // Emit the SVG shape with selection attached    
    const shape = this.rubberband.g;
    shape.annotation = this.rubberband.toSelection();
    this.emit('complete', shape);

    this.stop();
  }

  get isDrawing() {
    return this.rubberband != null;
  }

}