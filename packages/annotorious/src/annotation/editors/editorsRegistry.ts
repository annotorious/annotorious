import { ShapeType, type Shape } from '../../model';
import { PolygonEditor } from './polygon';
import { RectangleEditor } from './rectangle';

export type EditorComponent = PolygonEditor | RectangleEditor;

export function getEditor<T extends ShapeType>(shape: T) {
  if (shape === ShapeType.RECTANGLE) return RectangleEditor;
  if (shape === ShapeType.POLYGON) return PolygonEditor;
  throw new Error(`No behavior defined for shape type '${ShapeType}`)
}

