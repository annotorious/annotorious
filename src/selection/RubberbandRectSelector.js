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

  startDrawing = evt => {
    this._attachListeners();
    this.rubberband = new RubberbandRect(evt.offsetX, evt.offsetY, this.svg);
  }

  clear = () => {
    if (this.rubberband) {
      this.rubberband.destroy();
      this.rubberband = null;
    }
  }

  onMouseMove = evt =>
    this.rubberband.dragTo(evt.offsetX, evt.offsetY);

  onMouseUp = evt => {
    this._detachListeners();

    const { w } = this.rubberband.bbox;

    if (w > 3) {
      // Emit the SVG shape with selection attached    
      const shape = this.rubberband.shape;
      shape.annotation = this.rubberband.toSelection();
      this.emit('complete', shape);
    } else {
      this.clear();
      this.emit('cancel', evt);
    }
  }

}