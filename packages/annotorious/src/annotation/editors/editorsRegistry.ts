import { ShapeType, type Shape } from '../../model';
import type { SvelteComponent } from 'svelte';
import { PolygonEditor } from './polygon';
import { RectangleEditor } from './rectangle';

const REGISTERED = new Map<ShapeType, typeof SvelteComponent>([
  [ShapeType.RECTANGLE, RectangleEditor],
  [ShapeType.POLYGON, PolygonEditor]
]);

export const getEditor = (shape: Shape) => REGISTERED.get(shape.type);