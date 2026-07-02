import { approximateAsPolygon, boundsFromPoints } from '../../core';
import type { MultiPolygonElement, MultiPolygonRing, PolylineGeometry, PolylinePoint } from '../../core';

export const svgPathToMultiPolygonElement = (d: string): MultiPolygonElement | undefined => {
  const commands = parsePathCommands(d);

  const rings: MultiPolygonRing[] = [];
  let currentRing: [number, number][] = [];
  let currentPoint: [number, number] = [0, 0];

  for (const cmd of commands) {
    switch (cmd.type.toUpperCase()) {
      case 'M':
        // Start a new ring
        if (currentRing.length > 0) {
          rings.push({ points: currentRing });
          currentRing = [];
        }
        currentPoint = [cmd.args[0], cmd.args[1]];
        currentRing.push([...currentPoint]);
        break;

      case 'L':
        currentPoint = [cmd.args[0], cmd.args[1]];
        currentRing.push([...currentPoint]);
        break;

      case 'H':
        currentPoint = [cmd.args[0], currentPoint[1]];
        currentRing.push([...currentPoint]);
        break;

      case 'V':
        currentPoint = [currentPoint[0], cmd.args[0]];
        currentRing.push([...currentPoint]);
        break;

      case 'C':
        // For multi-polygon, we only care about the end point
        currentPoint = [cmd.args[4], cmd.args[5]];
        currentRing.push([...currentPoint]);
        break;

      case 'A': {
        const [rx, ry, xAxisRotation, largeArcFlag, sweepFlag, ex, ey] = cmd.args;
        const arcPoints = approximateArc(currentPoint, [ex, ey], rx, ry, xAxisRotation, largeArcFlag, sweepFlag);
        currentRing.push(...arcPoints);
        currentPoint = [ex, ey];
        break;
      }

      case 'Z':
        // Close the current ring (no action needed since we don't track closed state here)
        break;

      default:
        console.warn(`Unsupported SVG path command: ${cmd.type}`);
        break;
    }
  }

  if (currentRing.length > 2)
    rings.push({ points: currentRing });

  if (rings.length > 0) {
    const bounds = boundsFromPoints(rings[0].points);
    return { rings, bounds };
  }
}

// Shared by the 'C' and 'A' (arc-as-bezier) cases: appends a cubic bezier
// segment to the points list, wiring up in/out handles only where needed
const appendCubicSegment = (
  points: PolylinePoint[],
  cp1: [number, number],
  cp2: [number, number],
  end: [number, number]
) => {
  // Set outHandle for the previous point if it doesn't match the point itself
  if (points.length > 0) {
    const prevPoint = points[points.length - 1];
    if (cp1[0] !== prevPoint.point[0] || cp1[1] !== prevPoint.point[1]) {
      prevPoint.type = 'CURVE';
      prevPoint.outHandle = cp1;
    }
  }

  // Create the end point with inHandle if it doesn't match the point itself
  const newPoint: PolylinePoint = {
    type: cp2[0] !== end[0] || cp2[1] !== end[1] ? 'CURVE' : 'CORNER',
    point: end
  };

  if (newPoint.type === 'CURVE')
    newPoint.inHandle = cp2;

  points.push(newPoint);
}

const areHandlesSymmetrical = (pt: PolylinePoint) => {
  // Check if all three points are on a straight line (with a bit of tolerance)
  const { point, inHandle, outHandle } = pt;

  if (!inHandle || !outHandle) return false;

  const dx1 = inHandle[0] - point[0];
  const dy1 = inHandle[1] - point[1];
  const dx2 = outHandle[0] - point[0];
  const dy2 = outHandle[1] - point[1];

  const cross = dx1 * dy2 - dy1 * dx2;

  return Math.abs(cross) < 0.01;
}

export const svgPathToPolyline = (d: string): PolylineGeometry => {
  const commands = parsePathCommands(d);

  let points: PolylinePoint[] = [];

  let currentPoint: [number, number] = [0, 0];
  let closed = false;

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];

    switch (cmd.type.toUpperCase()) {
      case 'M':
        currentPoint = [cmd.args[0], cmd.args[1]];
        points.push({
          type: 'CORNER',
          point: [...currentPoint]
        });
        break;

      case 'L':
        currentPoint = [cmd.args[0], cmd.args[1]];
        points.push({
          type: 'CORNER',
          point: [...currentPoint]
        });
        break;

      case 'C': {
        const cp1: [number, number] = [cmd.args[0], cmd.args[1]];
        const cp2: [number, number] = [cmd.args[2], cmd.args[3]];
        const endPoint: [number, number] = [cmd.args[4], cmd.args[5]];

        appendCubicSegment(points, cp1, cp2, endPoint);
        currentPoint = endPoint;
        break;
      }

      case 'A': {
        const [rx, ry, xAxisRotation, largeArcFlag, sweepFlag, ex, ey] = cmd.args;
        const beziers = arcToBeziers(currentPoint, [ex, ey], rx, ry, xAxisRotation, largeArcFlag, sweepFlag);
        beziers.forEach(({ cp1, cp2, end }) => appendCubicSegment(points, cp1, cp2, end));
        currentPoint = [ex, ey];
        break;
      }

      case 'Z':
        closed = true;
        break;

      default:
        console.warn(`Unsupported SVG path command: ${cmd.type}`);
        break;
    }
  }

  points = points.map(pt => areHandlesSymmetrical(pt) ? {...pt, locked: true } : pt);
  const bounds = boundsFromPoints(approximateAsPolygon(points, closed));

  return {
    points,
    closed,
    bounds
  };
}

interface PathCommand {

  type: string;

  args: number[];

}

const parsePathCommands = (d: string) => {
  const commands: PathCommand[] = [];
  const cleanPath = d.replace(/,/g, ' ').trim();

  const commandRegex = /([MmLlHhVvCcAaZz])\s*([^MmLlHhVvCcAaZz]*)/g;
  let match;

  while ((match = commandRegex.exec(cleanPath)) !== null) {
    const [, commandLetter, argsString] = match;
    const args = argsString.trim() === '' ? [] :
      argsString.trim().split(/\s+/).map(Number).filter(n => !isNaN(n));

    const step = argStep(commandLetter);

    if (step === 0 || args.length <= step) {
      // Z or single-instance command
      commands.push({ type: commandLetter, args });
    } else {
      // Repeated commands
      for (let i = 0; i < args.length; i += step) {
        const impliedType = i === 0 ? commandLetter
          : commandLetter === 'M' ? 'L'
          : commandLetter === 'm' ? 'l'
          : commandLetter;
        commands.push({ type: impliedType, args: args.slice(i, i + step) });
      }
    }
  }

  return commands;
}

const argStep = (cmd: string): number => {
  switch (cmd.toUpperCase()) {
    case 'M': case 'L': return 2;
    case 'H': case 'V': return 1;
    case 'C': return 6;
    case 'A': return 7;
    case 'Z': return 0;
    default:  return 2;
  }
}

interface ArcCenterParams {

  cx: number;

  cy: number;

  rx: number;

  ry: number;

  cosPhi: number;

  sinPhi: number;

  theta1: number;

  dtheta: number;

}

// Endpoint-to-center arc parameterization, per SVG spec F.6.5
const arcToCenterParams = (
  start: [number, number],
  end: [number, number],
  rx: number,
  ry: number,
  xAxisRotationDeg: number,
  largeArcFlag: number,
  sweepFlag: number
): ArcCenterParams => {
  const [x1, y1] = start;
  const [x2, y2] = end;

  rx = Math.abs(rx);
  ry = Math.abs(ry);

  const phi = (xAxisRotationDeg % 360) * Math.PI / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  const dx2 = (x1 - x2) / 2;
  const dy2 = (y1 - y2) / 2;
  const x1p = cosPhi * dx2 + sinPhi * dy2;
  const y1p = -sinPhi * dx2 + cosPhi * dy2;

  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    const scale = Math.sqrt(lambda);
    rx *= scale;
    ry *= scale;
  }

  const rxSq = rx * rx;
  const rySq = ry * ry;
  const x1pSq = x1p * x1p;
  const y1pSq = y1p * y1p;

  const num = Math.max(rxSq * rySq - rxSq * y1pSq - rySq * x1pSq, 0);
  const denom = rxSq * y1pSq + rySq * x1pSq;
  const coef = (largeArcFlag !== sweepFlag ? 1 : -1) * (denom === 0 ? 0 : Math.sqrt(num / denom));

  const cxp = coef * (rx * y1p) / ry;
  const cyp = -coef * (ry * x1p) / rx;

  const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

  const angleBetween = (ux: number, uy: number, vx: number, vy: number) => {
    const sign = ux * vy - uy * vx < 0 ? -1 : 1;
    const dot = Math.max(-1, Math.min(1, (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy))));
    return sign * Math.acos(dot);
  };

  const theta1 = angleBetween(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dtheta = angleBetween((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);

  if (!sweepFlag && dtheta > 0) dtheta -= 2 * Math.PI;
  if (sweepFlag && dtheta < 0) dtheta += 2 * Math.PI;

  return { cx, cy, rx, ry, cosPhi, sinPhi, theta1, dtheta };
}

// Used for the Polygon/MultiPolygon case, whose geometry is a flat list of
// straight-edge points with no concept of curves - so the arc has to be flattened
const approximateArc = (
  start: [number, number],
  end: [number, number],
  rx: number,
  ry: number,
  xAxisRotationDeg: number,
  largeArcFlag: number,
  sweepFlag: number,
  segmentsPerFullTurn = 64
): [number, number][] => {
  const [x1, y1] = start;
  const [x2, y2] = end;

  if (rx === 0 || ry === 0 || (x1 === x2 && y1 === y2))
    return [[x2, y2]];

  const { cx, cy, rx: arx, ry: ary, cosPhi, sinPhi, theta1, dtheta } =
    arcToCenterParams(start, end, rx, ry, xAxisRotationDeg, largeArcFlag, sweepFlag);

  const segments = Math.max(4, Math.round(segmentsPerFullTurn * Math.abs(dtheta) / (2 * Math.PI)));

  const points: [number, number][] = [];
  for (let i = 1; i <= segments; i++) {
    const theta = theta1 + (dtheta * i) / segments;
    const ex = cx + arx * Math.cos(theta) * cosPhi - ary * Math.sin(theta) * sinPhi;
    const ey = cy + arx * Math.cos(theta) * sinPhi + ary * Math.sin(theta) * cosPhi;
    points.push([ex, ey]);
  }

  // Snap the last sampled point to the exact endpoint to avoid drift
  points[points.length - 1] = [x2, y2];

  return points;
}

interface CubicSegment {

  cp1: [number, number];

  cp2: [number, number];

  end: [number, number];

}

// Used for the Polyline case, whose PolylinePoint model natively supports cubic
// bezier handles - so the arc is approximated as a short chain of true curves
// (each spanning at most 90 degrees) rather than flattened into line segments
const arcToBeziers = (
  start: [number, number],
  end: [number, number],
  rx: number,
  ry: number,
  xAxisRotationDeg: number,
  largeArcFlag: number,
  sweepFlag: number
): CubicSegment[] => {
  const [x1, y1] = start;
  const [x2, y2] = end;

  if (rx === 0 || ry === 0 || (x1 === x2 && y1 === y2))
    return [{ cp1: end, cp2: end, end }];

  const { cx, cy, rx: arx, ry: ary, cosPhi, sinPhi, theta1, dtheta } =
    arcToCenterParams(start, end, rx, ry, xAxisRotationDeg, largeArcFlag, sweepFlag);

  // Split into segments of at most 90 degrees each, for a close cubic approximation
  const numSegments = Math.max(1, Math.ceil(Math.abs(dtheta) / (Math.PI / 2)));
  const delta = dtheta / numSegments;
  const alpha = (4 / 3) * Math.tan(delta / 4);

  const toEllipse = (x: number, y: number): [number, number] => [
    cx + arx * x * cosPhi - ary * y * sinPhi,
    cy + arx * x * sinPhi + ary * y * cosPhi
  ];

  const segments: CubicSegment[] = [];

  for (let i = 0; i < numSegments; i++) {
    const a1 = theta1 + i * delta;
    const a2 = a1 + delta;

    const cosA1 = Math.cos(a1), sinA1 = Math.sin(a1);
    const cosA2 = Math.cos(a2), sinA2 = Math.sin(a2);

    const cp1 = toEllipse(cosA1 - alpha * sinA1, sinA1 + alpha * cosA1);
    const cp2 = toEllipse(cosA2 + alpha * sinA2, sinA2 - alpha * cosA2);

    // Snap the final segment's endpoint to the exact target to avoid drift
    const segmentEnd = i === numSegments - 1 ? end : toEllipse(cosA2, sinA2);

    segments.push({ cp1, cp2, end: segmentEnd });
  }

  return segments;
}
