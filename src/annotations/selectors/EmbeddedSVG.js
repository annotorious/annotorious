import { SVG_NAMESPACE } from '../../SVGConst';

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

export const drawEmbeddedSVG = annotation => {
  return parseSVGFragment(annotation);
}