import { boundsFromPoints, multipolygonElementToPath, ShapeType } from '../../core';
import { parseSVGXML } from './SVG';
import { svgPathToMultiPolygonElement } from './pathParser';
import type { 
  Ellipse, 
  EllipseGeometry, 
  Line,
  LineGeometry,
  MultiPolygon,
  MultiPolygonGeometry, 
  Polygon, 
  PolygonGeometry, 
  Shape 
} from '../../core';

export interface SVGSelector {

  type: 'SvgSelector';

  value: string;

}

const parseSVGPolygon = (value: string): Polygon => {
  const [_, __, str] = value.match(/(<polygon points=["|'])([^("|')]*)/) || [];
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

const parseSVGLine = (value: string): Line => {
  const doc = parseSVGXML(value);

  const x1 = parseFloat(doc.getAttribute("x1")!);
  const x2 = parseFloat(doc.getAttribute("x2")!);
  const y1 = parseFloat(doc.getAttribute("y1")!);
  const y2 = parseFloat(doc.getAttribute("y2")!);

  const bounds = {
    minX: Math.min(x1, x2),
    minY: Math.min(y1, y2),
    maxX: Math.max(x1, x2),
    maxY: Math.max(y1, y2),
  };

  return {
    type: ShapeType.LINE,
    geometry: {
      points: [[x1, y1], [x2, y2]],
      bounds,
    },
  };
}

const parseSVGPath = (value: string): Polygon | MultiPolygon => {
  const doc = parseSVGXML(value);

  const paths = doc.nodeName === 'path' ? [doc] : Array.from(doc.querySelectorAll('path'));
  const d = paths.map(path => path.getAttribute('d') || '');

  const polygons = d.map(d => svgPathToMultiPolygonElement(d)!).filter(Boolean);

  const outerPoints = polygons.reduce<[number, number][]>((points, element) => {
    return [...points, ...element.rings[0].points]
  }, []);

  const bounds = boundsFromPoints(outerPoints);

  // No need to create a MultiPolygon if theres only a single element with an outer ring
  const isSinglePolygon = polygons.length === 1 && polygons[0].rings.length === 1;
  return isSinglePolygon ? {
    type: ShapeType.POLYGON,
    geometry: {
      points: outerPoints,
      bounds
    }
  } : {
    type: ShapeType.MULTIPOLYGLON,
    geometry: {
      polygons,
      bounds
    }
  }
}

export const parseSVGSelector = <T extends Shape>(valueOrSelector: SVGSelector | string): T => {
  const value = typeof valueOrSelector === 'string' ? valueOrSelector : valueOrSelector.value;

  if (value.includes('<polygon points='))
    return parseSVGPolygon(value) as unknown as T;
  else if (value.includes('<path '))
    return parseSVGPath(value) as unknown as T;
  else if (value.includes('<ellipse ')) 
    return parseSVGEllipse(value) as unknown as T;
  else if (value.includes("<line "))
    return parseSVGLine(value) as unknown as T;
  else 
    throw 'Unsupported SVG shape: ' + value;
}

const serializeMultiPolygon = (geom: MultiPolygonGeometry) => {
  const paths = geom.polygons.map(elem =>
    `<path fill-rule="evenodd" d="${multipolygonElementToPath(elem)}" />`);

  return `<g>${paths.join('')}</g>`
} 

export const serializeSVGSelector = (shape: Shape): SVGSelector => {
  let value: string | undefined;

  switch (shape.type) {
    case ShapeType.POLYGON: {
      const geom = shape.geometry as PolygonGeometry;
      const { points } = geom;
      value = `<svg><polygon points="${points.map((xy) => xy.join(',')).join(' ')}" /></svg>`;
      break;
    }
    case ShapeType.ELLIPSE: {
      const geom = shape.geometry as EllipseGeometry;
      value = `<svg><ellipse cx="${geom.cx}" cy="${geom.cy}" rx="${geom.rx}" ry="${geom.ry}" /></svg>`;
      break;
    }
    case ShapeType.MULTIPOLYGLON: {
      const geom = shape.geometry as MultiPolygonGeometry;
      value = `<svg>${serializeMultiPolygon(geom)}</svg>`;
      break;
    }
    case ShapeType.LINE: {
      const geom = shape.geometry as LineGeometry;
      const [[x1, y1], [x2, y2]] = geom.points;
      value = `<svg><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" /></svg>`;
      break;
    }
  }

  if (value) {
    return { type: 'SvgSelector', value };
  } else {
    throw `Unsupported shape type: ${shape.type}`;
  }
}
