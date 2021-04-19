import { Selection } from '@recogito/recogito-client-core';
import { toSVGTarget } from '../../selectors/EmbeddedSVG';
import { SVG_NAMESPACE } from '../../util/SVG';
import Mask from './PolygonMask';

export default class RubberbandPolygon {

  constructor(anchor, g, env) {
    this.points = [ anchor ];
    this.env = env;

    this.group = document.createElementNS(SVG_NAMESPACE, 'g');
    
    this.polygon = document.createElementNS(SVG_NAMESPACE, 'g');
    this.polygon.setAttribute('class', 'a9s-selection');

    this.outer = document.createElementNS(SVG_NAMESPACE, 'polygon');
    this.outer.setAttribute('class', 'a9s-outer');

    this.inner = document.createElementNS(SVG_NAMESPACE, 'polygon');
    this.inner.setAttribute('class', 'a9s-inner');

    this.setPoints(this.points);

    this.mask = new Mask(env.image, this.inner);

    this.polygon.appendChild(this.outer);
    this.polygon.appendChild(this.inner);

    // Additionally, selection remains hidden until 
    // the user actually moves the mouse
    this.group.style.display = 'none';

    this.group.appendChild(this.mask.element);
    this.group.appendChild(this.polygon);

    g.appendChild(this.group);
  }

  setPoints = points => {
    const attr = points.map(t => `${t[0]},${t[1]}`).join(' ');
    this.outer.setAttribute('points', attr);
    this.inner.setAttribute('points', attr);
  }

  get bbox() {
    return this.outer.getBBox();
  }

  dragTo = xy => {
    // Make visible
    this.group.style.display = null;

    const rubberband = [ ...this.points, xy ];
    
    this.setPoints(rubberband);
    this.mask.redraw();
  }

  addPoint = xy => {
    // Don't add a new point if distance < 2 pixels
    const lastCorner = this.points[this.points.length - 1];
    const dist = Math.pow(xy[0] - lastCorner[0], 2) + Math.pow(xy[1] - lastCorner[1], 2);
    
    if (dist > 4) {
      this.points = [ ...this.points, xy ];
      this.setPoints(this.points);   
      this.mask.redraw();
    }
  }

  get element() {
    return this.polygon;
  }

  destroy = () => {
    this.group.parentNode.removeChild(this.group);
    this.polygon = null;    
    this.group = null;
  }

  toSelection = () => {
    return new Selection(toSVGTarget(this.group, this.env.image));
  }

}
