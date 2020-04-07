import EventEmitter from 'tiny-emitter';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

import './RectDragSelector.scss';

export class Rectangle extends EventEmitter {

  constructor(fragment, svg) {
    super();

    const outerRect  = document.createElementNS(SVG_NAMESPACE, 'rect');
    const innerRect  = document.createElementNS(SVG_NAMESPACE, 'rect');

    const { x, y, w, h } =  fragment;

    outerRect.setAttribute('class', 'outer');
    outerRect.setAttribute('x', x - 0.5);
    outerRect.setAttribute('y', y - 0.5);
    outerRect.setAttribute('width', w + 1);
    outerRect.setAttribute('height',  h + 1);

    innerRect.setAttribute('class', 'inner');
    innerRect.setAttribute('x', x + 0.5);
    innerRect.setAttribute('y', y + 0.5);
    innerRect.setAttribute('width', w - 1);
    innerRect.setAttribute('height',  h - 1);

    svg.appendChild(outerRect);
    svg.appendChild(innerRect);

    const bounds = outerRect.getBoundingClientRect();

    innerRect.addEventListener('click', () => this.emit('click', { bounds }));
  }

}