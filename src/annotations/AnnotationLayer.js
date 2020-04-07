import EventEmitter from 'tiny-emitter';
import { parseFragment } from './AnnotationUtils';
import { Rectangle } from '../selection/RectDragSelector';

import './AnnotationLayer.scss';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

export default class AnnotationLayer extends EventEmitter {

  constructor(parentEl) {
    super();

    this.svg = document.createElementNS(SVG_NAMESPACE, 'svg');
    this.svg.classList.add('anno-annotationlayer');

    parentEl.appendChild(this.svg);
  }

  init = annotations => {
    annotations.forEach(annotation => {
      const fragment = parseFragment(annotation);
      const shape = new Rectangle(fragment, this.svg);
      shape.on('click', evt => this.emit('select', { 
        selection: annotation,
        bounds: evt.bounds
      }));
    });
  }

  addOrUpdateAnnotation = (annotation, previous) => {

  }

  removeAnnotation = annotation => {
    
  }

}