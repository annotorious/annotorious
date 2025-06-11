import { SVGPathData } from 'svg-pathdata';
import { boundsFromPoints, type MultiPolygonElement, type MultiPolygonRing } from '../../core';

export const svgPathToMultiPolygonElement = (d: string): MultiPolygonElement | undefined => {
  const commands = new SVGPathData(d).toAbs().commands;
  
  const rings: MultiPolygonRing[] = [];

  let currentRing: [number, number][] = [];
  let startPoint: [number, number] | null = null;
  
  for (const cmd of commands) {
    switch (cmd.type) {
      case SVGPathData.MOVE_TO:
        // Start a new ring
        if (currentRing.length > 0) {
          rings.push({ points: currentRing });
          currentRing = [];
        }

        startPoint = [cmd.x, cmd.y];
        currentRing.push(startPoint);
        break;
        
      case SVGPathData.LINE_TO:
        currentRing.push([cmd.x, cmd.y]);
        break;
        
      case SVGPathData.HORIZ_LINE_TO:
        // Get the last Y coordinate since H command only specifies X
        const lastY = currentRing[currentRing.length - 1][1];
        currentRing.push([cmd.x, lastY]);
        break;
        
      case SVGPathData.VERT_LINE_TO:
        // Get the last X coordinate since V command only specifies Y
        const lastX = currentRing[currentRing.length - 1][0];
        currentRing.push([lastX, cmd.y]);
        break;
      
      /** Might be needed in the future **
      case SVGPathData.CLOSE_PATH:
        if (startPoint && 
            (currentRing[currentRing.length - 1][0] !== startPoint[0] || 
              currentRing[currentRing.length - 1][1] !== startPoint[1])) {
          currentRing.push([...startPoint]);
        }
        rings.push({ points: currentRing });
        currentRing = [];
        startPoint = null;
        break;
      **/

      // For curve commands, we just add the end point
      case SVGPathData.CURVE_TO:
      case SVGPathData.SMOOTH_CURVE_TO:
      case SVGPathData.QUAD_TO:
      case SVGPathData.SMOOTH_QUAD_TO:
      case SVGPathData.ARC:
        currentRing.push([cmd.x, cmd.y]);
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