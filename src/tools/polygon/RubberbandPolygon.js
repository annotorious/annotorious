import { Selection } from '@recogito/recogito-client-core';
import { toSVGTarget } from '../annotations/selectors/EmbeddedSVG';
import { SVG_NAMESPACE } from '../SVGConst';

export default class RubberbandPolygon {

  constructor(anchor, g) {
    this.g = document.createElementNS(SVG_NAMESPACE, 'g');
    this.g.setAttribute('class', 'a9s-selection');

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
    this.points = [ ...head, xy, head[0] ];
    this.setPoints(this.points);   
  }

  destroy = () => {

  }

  toSelection = () => {
    return new Selection(toSVGTarget(this.g));
  }

}
