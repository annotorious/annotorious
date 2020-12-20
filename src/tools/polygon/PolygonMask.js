import { SVG_NAMESPACE } from '../../SVG';

export default class PolygonMask {

  constructor(imageDimensions, polygon) {
    this.w = imageDimensions.naturalWidth;
    this.h = imageDimensions.naturalHeight;

    this.polygon = polygon;

    this.mask = document.createElementNS(SVG_NAMESPACE, 'path');
    this.mask.setAttribute('fill-rule', 'evenodd');    
    this.mask.setAttribute('class', 'a9s-selection-mask');

    this.mask.setAttribute('d', `M0 0 h${this.w} v${this.h} h-${this.w} z M${this.polygon.getAttribute('points')} z`);
  }

  redraw = () => {
    this.mask.setAttribute('d', `M0 0 h${this.w} v${this.h} h-${this.w} z M${this.polygon.getAttribute('points')} z`);
  }

  get element() {
    return this.mask;
  }

  destroy = () =>
    this.mask.parentNode.removeChild(this.mask)

}