import type { Ellipse, EllipseGeometry, Polygon, PolygonGeometry, Shape } from '../../core';
import { boundsFromPoints, ShapeType } from '../../core';
import { insertSVGNamespace, sanitize, SVG_NAMESPACE } from './SVG';

export interface SVGSelector {

  type: 'SvgSelector';

  value: string;

}

const parseSVGXML = (value: string): Element => {
  const parser = new DOMParser();

  const doc = parser.parseFromString(value, "image/svg+xml");

  // SVG needs a namespace declaration - check if it's set or insert if not
  const isPrefixDeclared = doc.lookupPrefix(SVG_NAMESPACE); // SVG declared via prefix
  const isDefaultNamespaceSVG = doc.lookupNamespaceURI(null); // SVG declared as default namespace

  if (isPrefixDeclared || isDefaultNamespaceSVG) {
    return sanitize(doc).firstChild as Element;
  } else {
    return sanitize(insertSVGNamespace(doc)).firstChild as Element;
  }
}

const parseSVGPolygon = (value: string): Polygon => {
  const [a, b, str] = value.match(/(<polygon points=["|'])([^("|')]*)/) || [];
  const points = str.split(' ').map((p) => p.split(',').map(parseFloat));

  return {
    type: ShapeType.POLYGON,
    geometry: {
      points,
      bounds: boundsFromPoints(points as [number, number][])
    }
  };
}

const parseSVGEllipse = (value: string): Ellipse => {
  const doc = parseSVGXML(value);

  const cx = parseFloat(doc.getAttribute('cx')!);
  const cy = parseFloat(doc.getAttribute('cy')!);
  const rx = parseFloat(doc.getAttribute('rx')!);
  const ry = parseFloat(doc.getAttribute('ry')!);

  const bounds = {
    minX: cx - rx,
    minY: cy - ry,
    maxX: cx + rx,
    maxY: cy + ry
  };

  return {
    type: ShapeType.ELLIPSE,
    geometry: {
      cx,
      cy,
      rx,
      ry,
      bounds
    }
  };
}

export const parseSVGSelector = <T extends Shape>(valueOrSelector: SVGSelector | string): T => {
  const value = typeof valueOrSelector === 'string' ? valueOrSelector : valueOrSelector.value;

  if (value.includes('<polygon points='))
    return parseSVGPolygon(value) as unknown as T;
  else if (value.includes('<ellipse ')) 
    return parseSVGEllipse(value) as unknown as T;
  else 
    throw 'Unsupported SVG shape: ' + value;
}

export const serializeSVGSelector = (shape: Shape): SVGSelector => {
  let value: string | undefined;

  if (shape.type === ShapeType.POLYGON) {
    const geom = shape.geometry as PolygonGeometry;
    const { points } = geom;
    value = `<svg><polygon points="${points.map((xy) => xy.join(',')).join(' ')}" /></svg>`;
  } else if (shape.type === ShapeType.ELLIPSE) {
    const geom = shape.geometry as EllipseGeometry;
    value = `<svg><ellipse cx="${geom.cx}" cy="${geom.cy}" rx="${geom.rx}" ry="${geom.ry}" /></svg>`
  }

  if (value) {
    return { type: 'SvgSelector', value };
  } else {
    throw `Unsupported shape type: ${shape.type}`;
  }
}
