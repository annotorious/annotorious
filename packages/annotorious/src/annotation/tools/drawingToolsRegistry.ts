import RubberbandRectangle from './rectangle/RubberbandRectangle.svelte';
import RubberbandPolygon from './polygon/RubberbandPolygon.svelte';
import type { DrawingMode } from '../../AnnotoriousOpts';
import type { ShapeName } from 'src/model';

export type DrawingTool = 'RECTANGLE' | 'POLYGON';

export type DrawingToolOpts = {

  drawingMode?: DrawingMode;

  [key: string]: any;

}

export const drawingTool = {
  'RECTANGLE': { tool: RubberbandRectangle },
  'POLYGON': { tool: RubberbandPolygon }
} as const;

export const listDrawingTools = () => [...Object.keys(drawingTool)];

export const getTool = (name: ShapeName) => {
  if (name === "ELLIPSE") {
    throw new Error(`Not supported right now. Seems like this is part
      of an extension that needs to be baked into the main type system?`)
  }
  // TODO: I don't understand 'opts'
  return {tool: drawingTool[name], opts: undefined}
}  

// export const registerTool = (name: string, tool: Component, opts?: DrawingToolOpts) =>
//   REGISTERED.set(name, { tool, opts });
