import { parseRectFragment } from './RectFragment';

export const fragmentArea = annotation => {
  const { w, h } = parseRectFragment(annotation);
  return w * h;
}