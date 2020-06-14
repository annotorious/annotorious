import { SVG_NAMESPACE } from '../../SVGConst';
import { Environment } from '@recogito/recogito-client-core';

export const parseSVGFragment = annotation => {
  const selector = annotation.selector('SvgSelector');
  if (selector) {
    const { value } = selector;
    const parser = new DOMParser();
    
    // TODO hack...
    const doc = parser.parseFromString(value, "image/svg+xml");    
    const shape = doc.firstChild.firstChild; // importNode?

    const g = document.createElementNS(SVG_NAMESPACE, 'g');
    
    const inner = shape.cloneNode(true);
    inner.setAttribute('class', 'inner');

    const outer = shape.cloneNode(true);
    outer.setAttribute('class', 'outer');

    g.appendChild(outer);
    g.appendChild(inner);

    return g;
  }
}

export const toSVGTarget = shape => {
  const inner = shape.querySelector('.inner').cloneNode(true);
  inner.removeAttribute('class');
  inner.removeAttribute('xmlns');

  return {
    source: Environment.image?.src,
    selector: {
      type: "SVGSelector",
      value: `<svg:svg>${inner.outerHTML}</svg:svg>`
    }
  }
};

export const drawEmbeddedSVG = annotation => {
  return parseSVGFragment(annotation);
}