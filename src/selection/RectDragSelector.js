import EventEmitter from 'tiny-emitter';
import DraggableRect from './DraggableRect';

import './RectDragSelector.scss';

export class RectDragSelector extends EventEmitter {

  constructor(svg) {
    super();

    this.svg = svg;
    this.shape = null;
  }

  _attachListeners = () => {
    this.svg.addEventListener('mousemove', this.onMouseMove);
    this.svg.addEventListener('mouseup', this.onMouseUp);
  }

  _detachListeners = () => {
    this.svg.removeEventListener('mousemove', this.onMouseMove);
    this.svg.removeEventListener('mouseup', this.onMouseUp);
  }

  startDrawing = evt => {
    this._attachListeners();
    this.shape = new DraggableRect(evt.offsetX, evt.offsetY, this.svg);
  }

  clear = () => {
    if (this.shape) {
      this.shape.destroy();
      this.shape = null;
    }
  }

  // TODO make this work in all four quadrants
  onMouseMove = evt =>
    this.shape.dragTo(evt.offsetX, evt.offsetY);

  // TODO handle mouseup outside of layer
  onMouseUp = evt => {
    this._detachListeners();

    const { w } = this.shape.bbox;

    if (w > 3) {
      this.emit('complete', { 
        selection: this.shape.toSelection(),
        bounds: this.shape.getBoundingClientRect()
      });
    } else {
      this.clear();
      this.emit('cancel', evt);
    }
  }

}