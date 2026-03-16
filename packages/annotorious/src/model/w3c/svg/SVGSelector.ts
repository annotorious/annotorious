import { boundsFromPoints, computeSVGPath, multipolygonElementToPath, ShapeType } from '../../core';
import { parseSVGXML } from './SVG';
import { svgPathToMultiPolygonElement, svgPathToPolyline } from './pathParser';
import type { 
  Ellipse, 
  EllipseGeometry, 
  Line,
  LineGeometry,
  MultiPolygon,
  MultiPolygonGeometry, 
  Polygon, 
  PolygonGeometry, 
  Polyline,
  PolylineGeometry, 
  Rectangle,
  RectangleGeometry,
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

const parseSVGPathToPolyline = (value: string): Polyline => {
  const doc = parseSVGXML(value);

  const path = doc.nodeName === 'path' ? doc : Array.from(doc.querySelectorAll('path'))[0];
  const d = path?.getAttribute('d');

  if (!d)
    throw new Error('Could not parse SVG path');

  const polyline = svgPathToPolyline(d);

  if (!polyline)
    throw new Error('Could not parse SVG path');

  return {
    type: ShapeType.POLYLINE,
    geometry: polyline
  }
}

const parseSVGRect = (value: string): Rectangle => {
  const doc = parseSVGXML(value);

  const rect = doc.nodeName === 'rect' ? doc : Array.from(doc.querySelectorAll('rect'))[0];
  if (!rect) throw new Error('Could not parse SVG rect');

  const x = parseFloat(rect.getAttribute('x')!);
  const y = parseFloat(rect.getAttribute('y')!);
  const w = parseFloat(rect.getAttribute('width')!);
  const h = parseFloat(rect.getAttribute('height')!);

  const transform = rect.getAttribute('transform');
  let rot = 0;

  if (transform && transform.startsWith('rotate(')) {
    const match = transform.match(/rotate\(([^)]+)\)/);
    if (match) {
      const params = match[1].split(/\s+/).map(parseFloat);
      rot = (params[0] * Math.PI) / 180;
    }
  }

  // Compute bounds
  const cx = x + w / 2;
  const cy = y + h / 2;

  const corners = [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h]
  ];

  // Rotate corners around center
  const rotatedCorners = corners.map(([px, py]) => {
    const dx = px - cx;
    const dy = py - cy;

    const cos = Math.cos(rot);
    const sin = Math.sin(rot);

    return [
      cx + dx * cos - dy * sin,
      cy + dx * sin + dy * cos
    ];
  });

  const bounds = boundsFromPoints(rotatedCorners as [number, number][]);

  return {
    type: ShapeType.RECTANGLE,
    geometry: {
      x,
      y,
      w,
      h,
      rot,
      bounds
    }
  };
}

const parseSVGPathToPolygon = (value: string): Polygon | MultiPolygon => {
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
    type: ShapeType.MULTIPOLYGON,
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
  else if (value.includes('<path ') && (value.includes(' C ') || !value.includes('Z')))
    return parseSVGPathToPolyline(value) as unknown as T;
  else if (value.includes('<path '))
    return parseSVGPathToPolygon(value) as unknown as T;
  else if (value.includes('<ellipse ')) 
    return parseSVGEllipse(value) as unknown as T;
  else if (value.includes("<line "))
    return parseSVGLine(value) as unknown as T;
  else if (value.includes('<rect '))
    return parseSVGRect(value) as unknown as T;
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
    case ShapeType.RECTANGLE: {
      const geom = shape.geometry as RectangleGeometry;
      const { x, y, w, h, rot } = geom;

      if (rot === 0) {
        value = `<svg><rect x="${x}" y="${y}" width="${w}" height="${h}" /></svg>`;
      } else {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const angle = ((rot ?? 0) * 180) / Math.PI;

        value = `<svg><rect x="${x}" y="${y}" width="${w}" height="${h}" transform="rotate(${angle} ${cx} ${cy})" /></svg>`;
      }
      break;
    }
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
    case ShapeType.MULTIPOLYGON: {
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
    case ShapeType.POLYLINE: {
      const d = computeSVGPath(shape.geometry as PolylineGeometry);
      value = `<svg><path d="${d}" /></svg>`;
    }
  }

  if (value) {
    return { type: 'SvgSelector', value };
  } else {
    throw `Unsupported shape type: ${shape.type}`;
  }
}
