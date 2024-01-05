import type { SvelteComponent } from 'svelte';
import { RubberbandRectangle } from './rectangle';
import { RubberbandPolygon } from './polygon';
import type { DrawingMode } from '../../AnnotoriousOpts';

export type DrawingTool = 'rectangle' | 'polygon' | string;

export type DrawingToolOpts = {

  drawingMode?: DrawingMode;

  [key: string]: any;

}

// @ts-ignore
const REGISTERED = new Map<DrawingTool, { tool: typeof SvelteComponent, opts?: DrawingToolOpts }>([
  ['rectangle', { tool: RubberbandRectangle }],
  ['polygon', { tool: RubberbandPolygon }]
]);

export const listDrawingTools = () => [...REGISTERED.keys()];

export const getTool = (name: string) => REGISTERED.get(name);
  
export const registerTool = (name: string, tool: typeof SvelteComponent, opts?: DrawingToolOpts) =>
  REGISTERED.set(name, { tool, opts });
