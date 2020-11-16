import { Selection } from '@recogito/recogito-client-core';
import { toSVGTarget } from '../../selectors/EmbeddedSVG';
import { SVG_NAMESPACE } from '../../SVG';
import Mask from './PolygonMask';

export default class RubberbandPolygon {

  constructor(anchor, g, env) {
    this.g = document.createElementNS(SVG_NAMESPACE, 'g');
    this.g.setAttribute('class', 'a9s-selection');

    this.env = env;

    this.polygon = document.createElementNS(SVG_NAMESPACE, 'g');

    this.outer = document.createElementNS(SVG_NAMESPACE, 'polygon');
    this.outer.setAttribute('class', 'a9s-outer');

    this.inner = document.createElementNS(SVG_NAMESPACE, 'polygon');
    this.inner.setAttribute('class', 'a9s-inner');

    this.points = [ anchor ];

    this.setPoints(this.points);

    this.mask = new Mask(env.image, this.inner);

    this.polygon.appendChild(this.outer);
    this.polygon.appendChild(this.inner);

    // Additionally, selection remains hidden until 
    // the user actually moves the mouse
    this.g.style.display = 'none';

    this.g.appendChild(this.mask.element);
    this.g.appendChild(this.polygon);

    this.isCollapsed = true;

    g.appendChild(this.g);
  }

  setPoints = points => {
    const attr = points.map(t => `${t[0]},${t[1]}`).join(' ');
    this.outer.setAttribute('points', attr);
    this.inner.setAttribute('points', attr);
  }

  dragTo = xy => {
    // Make visible
    this.g.style.display = null;

    this.isCollapsed = false;

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
    this.g.parentNode.removeChild(this.g);
    this.g = null;
  }

  toSelection = () => {
    return new Selection(toSVGTarget(this.g, this.env.image));
  }

}
