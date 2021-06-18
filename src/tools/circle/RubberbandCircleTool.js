import EventEmitter from 'tiny-emitter';
import RubberbandCircle from './RubberbandCircle';
import EditableCircle from './EditableCircle';

/**
 * A rubberband selector for circle fragments.
 */
export default class RubberbandCircleTool extends Tool {

  constructor(g, config, env) {
    // Most of the basics are handled in the Tool base class
    super(g, config, env);

    this.rubberband = null;
  }

  startDrawing = (x, y) => {
    this.attachListeners({
      mouseMove: this.onMouseMove,
      mouseUp: this.onMouseUp
    });

    this.rubberband = new RubberbandCircle(x, y, this.g, this.env);
  }

  stop = () => {
    if (this.rubberband) {
      this.rubberband.destroy();
      this.rubberband = null;
    }
  }

  onMouseMove = (x, y) =>
    this.rubberband.dragTo(x, y);
  
  onMouseUp = () => {
    this.detachListeners();
    this.started = false;

    const { width, height } = this.rubberband.getBoundingClientRect();

    const minWidth = this.config.minSelectionWidth || 4;
    const minHeight = this.config.minSelectionHeight || 4;

    if (width >= minWidth && height >= minHeight) {
      // Emit the SVG shape with selection attached    
      const { element } = this.rubberband;
      element.annotation = this.rubberband.toSelection();

      // Emit the completed shape...
      this.emit('complete', element);
    } else {
      this.emit('cancel');
    }

    this.stop();
  }

  get isDrawing() {
    return this.rubberband != null;
  }
  
  createEditableShape = annotation =>
    new EditableCircle(annotation, this.g, this.config, this.env);

}

RubberbandCircleTool.identifier = 'circle';

RubberbandCircleTool.supports = annotation => {
  const fragmentSelector = annotation.selector('FragmentSelector');
  return fragmentSelector?.conformsTo.startsWith('http://www.w3.org/TR/media-frags');
}