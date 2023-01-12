import { SVG_NAMESPACE } from './util/SVG';

export default class Crosshair {

  constructor(layerGroup, width, height) {
    this.svg = layerGroup.closest('svg');

    this.g = document.createElementNS(SVG_NAMESPACE, 'g');
    this.g.setAttribute('class', 'a9s-crosshair');

    const h = document.createElementNS(SVG_NAMESPACE, 'line');
    const v = document.createElementNS(SVG_NAMESPACE, 'line');

    this.g.appendChild(h);
    this.g.appendChild(v);

    layerGroup.appendChild(this.g);
    
    const getSVGPoint = evt => {
      const bbox = this.svg.getBoundingClientRect();
  
      const x = evt.clientX - bbox.x;
      const y = evt.clientY - bbox.y;
  
      const pt = this.svg.createSVGPoint();
  
      const { left, top } = this.svg.getBoundingClientRect();
      pt.x = x + left;
      pt.y = y + top;
  
      return pt.matrixTransform(layerGroup.getScreenCTM().inverse());
    }

    this.svg.addEventListener('pointermove', evt => {
      const { x, y } = getSVGPoint(evt);

      h.setAttribute('x1', 0);
      h.setAttribute('y1', y);
      h.setAttribute('x2', width);
      h.setAttribute('y2', y);

      v.setAttribute('x1', x);
      v.setAttribute('y1', 0);
      v.setAttribute('x2', x);
      v.setAttribute('y2', height);
    });
  }

}
