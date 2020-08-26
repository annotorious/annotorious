import EventEmitter from 'tiny-emitter';
import RubberbandPolygon from './RubberbandPolygon';
import EditablePolygon from './EditablePolygon';

/**
 * A rubberband selector for rectangle fragments.
 */
export default class RubberbandPolygonTool extends EventEmitter {

  constructor(g) {
    super();

    this.svg = g.closest('svg');
    this.g = g;

    this.isDrawing = false;

    this.supportsModify = true;
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
    if (!this.isDrawing) {
      this.isDrawing = true;

      const { x, y } = this._toSVG(evt.layerX, evt.layerY);
      this._attachListeners();
      this.rubberband = new RubberbandPolygon([ x, y ], this.g);
    }
  }

  stop = () => {
    this._detachListeners();
    this.isDrawing = false;
    
    if (this.rubberband) {
      this.rubberband.destroy();
      this.rubberband = null;
    }
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
      console.log('toSVG', x, y);
      this.rubberband.addPoint([ x, y ]);
    }
  }

  onDblClick = evt => {
    this._detachListeners();
    this.isDrawing = false;

    const { x , y } = this._toSVG(evt.layerX, evt.layerY);
    this.rubberband.addPoint([ x, y ]);

    // Emit the SVG shape with selection attached    
    const shape = this.rubberband.g;
    shape.annotation = this.rubberband.toSelection();
    this.emit('complete', shape);
  }

  createEditableShape = annotation =>
    new EditablePolygon(annotation, this.g);

}