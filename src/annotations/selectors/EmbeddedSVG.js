import { SVG_NAMESPACE } from '../../SVG';

/** Helper that forces an un-namespaced node to SVG **/
const insertSVGNamespace = originalDoc => {
  // Serialize and parse for the namespace to take effect on every node
  const serializer = new XMLSerializer();
  const str = serializer.serializeToString(originalDoc.documentElement);

  // Doesn't seem that there's a clean cross-browser way for this...
  const namespaced = str.replace('<svg>', `<svg xmlns="${SVG_NAMESPACE}">`);

  const parser = new DOMParser();
  const namespacedDoc = parser.parseFromString(namespaced, "image/svg+xml");
  return namespacedDoc.documentElement;
}

/** TODO allow only primitive types (polygon, path, circle, rect) **/
const sanitize = doc => {
  return doc;
}

const parseSVGFragment = annotation => {
  const selector = annotation.selector('SvgSelector');
  if (selector) {
    const parser = new DOMParser();

    // Parse the XML document, assuming SVG
    const { value } = selector;
    const doc = parser.parseFromString(value, "image/svg+xml");

    // SVG needs a namespace declaration - check if it's set or insert if not
    const isPrefixDeclared = doc.lookupPrefix(SVG_NAMESPACE); // SVG declared via prefix
    const isDefaultNamespaceSVG = doc.lookupNamespaceURI(null); // SVG declared as default namespace

    if (isPrefixDeclared || isDefaultNamespaceSVG) {
      return sanitize(doc).firstChild;
    } else {
      return sanitize(insertSVGNamespace(doc)).firstChild;
    }
  }
}

export const drawEmbeddedSVG = annotation => {
  const shape = parseSVGFragment(annotation);

  // Because we're nitpicky, we don't just draw the shape,
  // but duplicate it, so we can have inner and an outer lines
  const g = document.createElementNS(SVG_NAMESPACE, 'g');

  const inner = shape.cloneNode(true);
  inner.setAttribute('class', 'a9s-inner');

  const outer = shape.cloneNode(true);
  outer.setAttribute('class', 'a9s-outer');

  g.appendChild(outer);
  g.appendChild(inner);

  return g;
}

export const toSVGTarget = (shape, imageSrc) => {
  const inner = shape.querySelector('.a9s-inner').cloneNode(true);
  inner.removeAttribute('class');
  inner.removeAttribute('xmlns');

  let serialized = inner.outerHTML || new XMLSerializer().serializeToString(inner);
  serialized = serialized.replace(` xmlns="${SVG_NAMESPACE}"`, '');

  return {
    source: imageSrc,
    selector: {
      type: "SvgSelector",
      value: `<svg>${serialized}</svg>`
    }
  }
}
