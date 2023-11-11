import type { SvelteComponent } from 'svelte';
import { RubberbandRectangle } from './rectangle';
import { RubberbandPolygon } from './polygon';

export type DrawingTool = 'rectangle' | 'polygon' | string;

const REGISTERED = new Map<DrawingTool, typeof SvelteComponent>([
  ['rectangle', RubberbandRectangle],
  ['polygon', RubberbandPolygon]
]);

export const listDrawingTools = () => [...REGISTERED.keys()];

export const getTool = (name: string) => REGISTERED.get(name);
  
export const registerTool = (name: string, tool: typeof SvelteComponent) =>
  REGISTERED.set(name, tool);
