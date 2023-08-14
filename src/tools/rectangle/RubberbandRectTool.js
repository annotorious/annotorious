import RubberbandRect from './RubberbandRect';
import EditableRect from './EditableRect';
import Tool from '../Tool';

/**
 * A rubberband selector for rectangle fragments.
 */
export default class RubberbandRectTool extends Tool {

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

    this.rubberband = new RubberbandRect(x, y, this.g, this.config, this.env);
  }

  stop = () => {
    if (this.rubberband) {
      this.rubberband.destroy();
      this.rubberband = null;
    }
  }

  onMouseMove = (x, y) => {
    // Constrain the initial coordinates (x, y) to be within the image bounds
    const { naturalWidth, naturalHeight } = this.env.image;
    const constrainX = Math.min(Math.max(x, 0), naturalWidth);
    const constrainY = Math.min(Math.max(y, 0), naturalHeight);

    this.rubberband.dragTo(constrainX, constrainY);
  }
  
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
  
  createEditableShape = (annotation, formatters) =>
    new EditableRect(annotation, this.g, {...this.config, formatters}, this.env);

}

RubberbandRectTool.identifier = 'rect';

RubberbandRectTool.supports = annotation => {
  const fragmentSelector = annotation.selector('FragmentSelector');
  return fragmentSelector?.conformsTo.startsWith('http://www.w3.org/TR/media-frags');
}