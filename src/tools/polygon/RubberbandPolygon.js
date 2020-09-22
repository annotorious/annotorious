import { Selection } from '@recogito/recogito-client-core';
import { toSVGTarget } from '../../annotations/selectors/EmbeddedSVG';
import { SVG_NAMESPACE } from '../../SVG';

export default class RubberbandPolygon {

  constructor(anchor, g, env) {
    this.g = document.createElementNS(SVG_NAMESPACE, 'g');
    this.g.setAttribute('class', 'a9s-selection');

    this.env = env;

    this.outer = document.createElementNS(SVG_NAMESPACE, 'polygon');
    this.outer.setAttribute('class', 'outer');

    this.inner = document.createElementNS(SVG_NAMESPACE, 'polygon');
    this.inner.setAttribute('class', 'inner');

    this.points = [ anchor, anchor ];

    this.setPoints(this.points);

    this.g.appendChild(this.outer);
    this.g.appendChild(this.inner);

    this.isCollapsed = true;

    g.appendChild(this.g);
  }

  setPoints = points => {
    const attr = points.map(t => `${t[0]},${t[1]}`).join(' ');
    this.outer.setAttribute('points', attr);
    this.inner.setAttribute('points', attr);
  }

  dragTo = xy => {
    this.isCollapsed = false;

    const head = this.points.slice(0, this.points.length - 1);
    const rubberband = [ ...head, xy, head[0] ];
    this.setPoints(rubberband);
  }

  addPoint = xy => {
    const head = this.points.slice(0, this.points.length - 1);

    // Don't add a new point if distance < 2 pixels
    const lastCorner = head[head.length - 1];
    const dist = Math.pow(xy[0] - lastCorner[0], 2) + Math.pow(xy[1] - lastCorner[1], 2);
    
    if (dist > 4) {
      this.points = [ ...head, xy, head[0] ];
      this.setPoints(this.points);   
    }
  }

  destroy = () => {
    this.g.parentNode.removeChild(this.g);
    this.g = null;
  }

  toSelection = () => {
    return new Selection(toSVGTarget(this.g, this.env.image));
  }

}
