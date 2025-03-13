import type { Ellipse, EllipseGeometry, MultiPolygonGeometry, Polygon, PolygonGeometry, Shape } from '../../core';
import { boundsFromPoints, multipolygonElementToPath, ShapeType } from '../../core';
import { insertSVGNamespace, sanitize, SVG_NAMESPACE } from './SVG';

export interface SVGSelector {

  type: 'SvgSelector';

  value: string;

}

type Point = [number, number];
type Points = Point[];

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

const parseSVGPath = (value: string): Polygon => {
  const doc = parseSVGXML(value);
  const path = doc.getAttribute('d')
  const polygons: Points[] = [];

  if (!path) {
    throw new Error("Unsupported SVG path (no d attribute)");
  }

  function parseCommands(args: string): string[] {
    const regex = /[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi;
    const commands = args.match(regex);
    return commands ? commands : [];
  }

  function parseNumbers(args: string): number[] {
    const regNumber = /-?[0-9]*\.?[0-9]+(?:e[-+]?\d+)?/gi;
    const numbers = args.match(regNumber);
    return numbers ? numbers.map(Number) : [];
  }

  const commands = parseCommands(path);

  let points: Points = [];
  commands.forEach((command) => {
    let op = command[0];
    const numbers = parseNumbers(command.slice(1).trim());
    const isRelative = op !== op.toUpperCase();

    switch (op.toUpperCase()) {
      case "M":
      case "L":
        for (let i = 0; i < numbers.length; i += 2) {
          const xy: number[] = numbers.slice(i, i + 2);
          points.push([
            isRelative ? xy[0] + points[points.length - 1][0] : xy[0],
            isRelative ? xy[1] + points[points.length - 1][1] : xy[1],
          ]);
        }
        break;
      case "V":
        numbers.forEach((number) => {
          points.push([
            points[points.length - 1][0],
            isRelative ? number + points[points.length - 1][1] : number,
          ]);
        });
        break;
      case "H":
        numbers.forEach((number) => {
          points.push([
            isRelative ? number + points[points.length - 1][0] : number,
            points[points.length - 1][1],
          ]);
        });
        break;
      case "Z":
        polygons.push([...points]);
        points = [];
        break;
      default:
        throw new Error("Unsupported SVG path (unsupported command " + op + ")");
    }
  });

  // close last path?
  if (points.length) {
    polygons.push([...points]);
  }

  if (polygons.length > 1) {
      throw new Error("Unsupported SVG path (multiple polygons)");
  }

  return {
    type: ShapeType.POLYGON,
    geometry: {
      points: polygons[0],
      bounds: boundsFromPoints(polygons[0])
    }
  };
}

export const parseSVGSelector = <T extends Shape>(valueOrSelector: SVGSelector | string): T => {
  const value = typeof valueOrSelector === 'string' ? valueOrSelector : valueOrSelector.value;

  if (value.includes('<polygon points='))
    return parseSVGPolygon(value) as unknown as T;
  else if (value.includes('<path '))
    return parseSVGPath(value) as unknown as T;
  else if (value.includes('<ellipse ')) 
    return parseSVGEllipse(value) as unknown as T;
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

  if (shape.type === ShapeType.POLYGON) {
    const geom = shape.geometry as PolygonGeometry;
    const { points } = geom;
    value = `<svg><polygon points="${points.map((xy) => xy.join(',')).join(' ')}" /></svg>`;
  } else if (shape.type === ShapeType.ELLIPSE) {
    const geom = shape.geometry as EllipseGeometry;
    value = `<svg><ellipse cx="${geom.cx}" cy="${geom.cy}" rx="${geom.rx}" ry="${geom.ry}" /></svg>`;
  } else if (shape.type === ShapeType.MULTIPOLYGLON) {
    const geom = shape.geometry as MultiPolygonGeometry;
    value = `<svg>${serializeMultiPolygon(geom)}</svg>`;
  }

  if (value) {
    return { type: 'SvgSelector', value };
  } else {
    throw `Unsupported shape type: ${shape.type}`;
  }
}
