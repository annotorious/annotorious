import EventEmitter from 'tiny-emitter';
import RubberbandRect from './RubberbandRect';

/**
 * A rubberband selector for rectangle fragments.
 */
export default class RubberbandRectSelector extends EventEmitter {

  constructor(svg) {
    super();

    this.svg = svg;

    this.rubberband = null;
  }

  _attachListeners = () => {
    this.svg.addEventListener('mousedown', this.onMouseDown);
    this.svg.addEventListener('mousemove', this.onMouseMove);
    
    // capture outside SVG, too
    document.addEventListener('mouseup', this.onMouseUp);
  }

  _detachListeners = () => {
    this.svg.removeEventListener('mousedown', this.onMouseDown);
    this.svg.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  _toSVG = (x, y) => {
    const pt = this.svg.createSVGPoint();

    const { left, top } = this.svg.getBoundingClientRect();
    pt.x = x + left;
    pt.y = y + top;

    return pt.matrixTransform(this.svg.getScreenCTM().inverse());
  }   

  startDrawing = evt => {
    const { x, y } = this._toSVG(evt.layerX, evt.layerY);
    this._attachListeners();
    this.rubberband = new RubberbandRect(x, y, this.svg);
  }

  stop = () => {
    if (this.rubberband) {
      this.rubberband.destroy();
      this.rubberband = null;
    }
  }

  onMouseMove = evt => {
    const { x , y } = this._toSVG(evt.layerX, evt.layerY);
    this.rubberband.dragTo(x, y);
  }
  
  onMouseUp = evt => {
    this._detachListeners();

    const { w } = this.rubberband.bbox;

    if (w > 3) {
      // Emit the SVG shape with selection attached    
      const shape = this.rubberband.shape;
      shape.annotation = this.rubberband.toSelection();
      this.emit('complete', shape);
    } else {
      this.stop();
      this.emit('cancel', evt);
    }
  }

}