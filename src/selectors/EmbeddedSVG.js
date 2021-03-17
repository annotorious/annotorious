import { SVG_NAMESPACE } from '../util/SVG';

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

export const svgFragmentToShape = annotation => {
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

export const svgFragmentToPoints = annotation => {
  const svgShape = svgFragmentToShape(annotation);
  
  return svgShape.getAttribute('points')
    .split(' ') // Split x/y tuples
    .map(xy => xy.split(',').map(str => parseFloat(str.trim())));
}

export const drawEmbeddedSVG = annotation => {
  const shape = svgFragmentToShape(annotation);

  // Hack
  svgFragmentToPoints(annotation);

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

export const toSVGTarget = (shape, image) => {
  const inner = shape.querySelector('.a9s-inner').cloneNode(true);
  inner.removeAttribute('class');
  inner.removeAttribute('xmlns');

  let serialized = inner.outerHTML || new XMLSerializer().serializeToString(inner);
  serialized = serialized.replace(` xmlns="${SVG_NAMESPACE}"`, '');

  return {
    source: image.src,
    selector: {
      type: "SvgSelector",
      value: `<svg>${serialized}</svg>`
    }
  }
}

/**
 * Computes the area of the given polygon (or polygon annotation)
 * @param {Array<Points> | WebAnnotation} arg 
 */
export const polygonArea = arg => {
  const points = arg.type === 'Annotation' ?
    svgFragmentToPoints(arg) : arg;

  let sum = 0;

  for (let i=0; i < points.length - 1; i++) {
    sum += points[i][0] * points[i + 1][1] - points[i][1] * points[i + 1][0];
  }

  return Math.abs(0.5 * sum);
}

/**
 * Computes the bounding box of the given polygon (or polygon annotation)
 * @param {Array<Points> | WebAnnotation} arg 
 */
export const polygonBounds = arg => {
  const points = arg.type === 'Annotation' ?
    svgFragmentToPoints(arg) : arg;

  const x = points.map(xy => xy[0]);
  const y = points.map(xy => xy[1]);

  const minX = Math.min(...x);
  const maxX = Math.max(...x);
  const minY = Math.min(...y);
  const maxY = Math.max(...y);

  return {
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY
  };
}