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

export const svgPathToPolyline = (d: string): PolylineGeometry => {
  const commands = parsePathCommands(d);

  const points: PolylinePoint[] = [];

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
        
      case 'C':
        const cp1: [number, number] = [cmd.args[0], cmd.args[1]];
        const cp2: [number, number] = [cmd.args[2], cmd.args[3]];
        const endPoint: [number, number] = [cmd.args[4], cmd.args[5]];
        
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
          type: cp2[0] !== endPoint[0] || cp2[1] !== endPoint[1] ? 'CURVE' : 'CORNER',
          point: endPoint
        };
        
        if (newPoint.type === 'CURVE')
          newPoint.inHandle = cp2;
        
        points.push(newPoint);
        currentPoint = endPoint;
        break;
        
      case 'Z':
        closed = true;
        break;
        
      default:
        console.warn(`Unsupported SVG path command: ${cmd.type}`);
        break;
    }
  }

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
  
  // Updated regex to include H and V commands
  const commandRegex = /([MmLlHhVvCcZz])\s*([^MmLlHhVvCcZz]*)/g;
  let match;
  
  while ((match = commandRegex.exec(cleanPath)) !== null) {
    const [, commandLetter, argsString] = match;
    const args = argsString.trim() === '' ? [] : 
      argsString.trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
    
    commands.push({
      type: commandLetter,
      args
    });
  }
  
  return commands;
}