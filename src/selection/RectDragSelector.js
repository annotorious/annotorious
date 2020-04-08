import EventEmitter from 'tiny-emitter';
import { parseFragment } from '../annotations/AnnotationUtils';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

import './RectDragSelector.scss';

export class Rectangle extends EventEmitter {

  // TODO group?
  constructor(annotation, svg) {
    super();  

    const fragment = parseFragment(annotation);

    const g = document.createElementNS(SVG_NAMESPACE, 'g');
    g.setAttribute('class', 'a9s-annotation');
    g.setAttribute('data-id', annotation.id);
    g.annotation = annotation;

    const outerRect  = document.createElementNS(SVG_NAMESPACE, 'rect');
    const innerRect  = document.createElementNS(SVG_NAMESPACE, 'rect');

    const { x, y, w, h } =  fragment;
    innerRect.setAttribute('class', 'inner');
    innerRect.setAttribute('x', x + 0.5);
    innerRect.setAttribute('y', y + 0.5);
    innerRect.setAttribute('width', w - 1);
    innerRect.setAttribute('height',  h - 1);

    outerRect.setAttribute('class', 'outer');
    outerRect.setAttribute('data-id', annotation.id);
    outerRect.setAttribute('x', x - 0.5);
    outerRect.setAttribute('y', y - 0.5);
    outerRect.setAttribute('width', w + 1);
    outerRect.setAttribute('height',  h + 1);

    g.appendChild(outerRect);
    g.appendChild(innerRect);
    svg.appendChild(g);

    const bounds = g.getBoundingClientRect();

    g.addEventListener('click', () => this.emit('click', { bounds }));
  }

}