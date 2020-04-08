import EventEmitter from 'tiny-emitter';
import { SVG_NAMESPACE} from '../SVGConst';
import { RectDragSelector } from '../selection/RectDragSelector';

import './DrawLayer.scss';

class DrawLayer extends EventEmitter {

  constructor(wrapperEl) {
    super();

    this.svg = document.createElementNS(SVG_NAMESPACE, 'svg');
    this.svg.classList.add('a9s-drawlayer');

    wrapperEl.appendChild(this.svg);

    this.svg.addEventListener('mousedown', this.onMouseDown);

    // TODO make switchable in the future
    const selector = new RectDragSelector(this.svg);
    selector.on('complete', this.onDrawingComplete);
    selector.on('cancel', this.onDrawingCanceled);

    this.currentTool = selector;
  }

  onMouseDown = evt => {
    this.currentTool.startDrawing(evt);
  }

  onDrawingComplete = evt => {
    console.log('Drawing complete');
  }

  onDrawingCanceled = evt => {
    console.log('Drawing canceled');
  }

}

export default DrawLayer;