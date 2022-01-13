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

const sanitize = doc => {
  // Cf. https://github.com/mattkrick/sanitize-svg#readme  
  // for the basic approach
  const cleanEl = el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on'))
        el.removeAttribute(attr.name)
    });
  }

  // Remove script tags
  const scripts = doc.getElementsByTagName('script');
  Array.from(scripts).reverse().forEach(el =>
    el.parentNode.removeChild(el));

  // Remove on... attributes
  cleanEl(doc);
  Array.from(doc.querySelectorAll('*')).forEach(cleanEl);

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

export const drawEmbeddedSVG = annotation => {
  const shape = svgFragmentToShape(annotation);

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
    source: image?.src,
    selector: {
      type: "SvgSelector",
      value: `<svg>${serialized}</svg>`
    }
  }
}

export const svgArea = annotation => {
  const shape = svgFragmentToShape(annotation);
  const nodeName = shape.nodeName.toLowerCase();

  if (nodeName === 'polygon') 
    return polygonArea(shape);
  else if (nodeName === 'circle')
    return circleArea(shape);
  else if (nodeName === 'ellipse')
    return ellipseArea(shape);
  else if (nodeName == 'path')
    return pathArea(shape);
  else
    throw `Unsupported SVG shape type: ${nodeName}`;
}

export const getAreaOfPoints = points =>{
  let area = 0;
  let j = points.length - 1;

  for (let i=0; i < points.length; i++) {
    area += (points[j][0] + points[i][0]) * (points[j][1] - points[i][1]);
    j = i;
  }

  return Math.abs(0.5 * area);
}

export const pointInsidePoygon = (point, vs) => {
  // Algorithm checks, if point is in Polygon
  // algorithm based on
  // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html
  
  var x = point[0], y = point[1];
  
  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      var xi = vs[i][0], yi = vs[i][1];
      var xj = vs[j][0], yj = vs[j][1];
      
      var intersect = ((yi > y) != (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
  }
  
  return inside;
};

const isHole = (polygon1, polygon2) => {
  // Algorithm checks, if polygon1 is in polygon2
  for (var point of polygon1){
    if (!pointInsidePoygon(point, polygon2)) return false
  }
  return true;
}

const polygonArea = polygon => {
  const points = polygon.getAttribute('points')
    .split(' ') // Split x/y tuples
    .map(xy => xy.split(',').map(str => parseFloat(str.trim())));
  return getAreaOfPoints(points)
}

const circleArea = circle => {
  const r = circle.getAttribute('r');
  return r * r * Math.PI;
}

const ellipseArea = ellipse => {
  const rx = ellipse.getAttribute('rx');
  const ry = ellipse.getAttribute('ry');
  return rx * ry * Math.PI;
}

const pathArea = path => {
  const pointList = path.getAttribute('d').split('L');
  let area = 0;

  if(pointList.length > 1) {
    var point = pointList[pointList.length - 1].trim().split(' ');
    let lastX = parseFloat(point[0]);
    let lastY = parseFloat(point[1]);

    point = pointList[0].substring(1).trim().split(' ');
    let x = parseFloat(point[0]);
    let y = parseFloat(point[1]);
    area += (lastX + x) * (lastY - y);
    lastX = x;
    lastY = y;

    for (let i = 1; i < pointList.length; i++) {
      point = pointList[i].trim().split(' ');
      x = parseFloat(point[0]);
      y = parseFloat(point[1]);
      area += (lastX + x) * (lastY - y);
      lastX = x;
      lastY = y;
    }
  }

  return Math.abs(0.5 * area);
}