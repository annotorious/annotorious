import type { Annotation } from "./Annotation";
import type { AnnotationState } from "./AnnotationState";

type RGB = `rgb(${number}, ${number}, ${number})`;

type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;

type HEX = `#${string}`;

export type Color = RGB | RGBA | HEX;

export interface DrawingStyle {

  fill?: Color;

  fillOpacity?: number;

  stroke?: Color;

  strokeOpacity?: number;

  strokeWidth?: number;

}

export type DrawingStyleExpression<T extends Annotation = Annotation> =
  DrawingStyle | ((annotation: T, state?: AnnotationState) => DrawingStyle | undefined);

/** Utility functions **/

export const computeStyle = <T extends Annotation = Annotation>(
  annotation: T,
  style: DrawingStyleExpression<T>,
  state?: AnnotationState
) => {
  return typeof style === 'function' ? style(annotation, state) : style;
};

export const chainStyles = <T extends Annotation = Annotation>(
  applyFirst: DrawingStyleExpression<T>,
  applySecond: DrawingStyleExpression<T>
) => {
  if (typeof applyFirst !== 'function' && typeof applySecond !== 'function') {
    // Simple case: just two objects
    return {
      ...(applyFirst || {}),
      ...(applySecond || {})
    };
  } else {
    // Return a function
    return (a: T, state: AnnotationState) => {
      const first = typeof applyFirst === 'function' ? applyFirst(a, state) : applyFirst;
      const second = typeof applySecond === 'function' ? applySecond(a, state) : applySecond;

      return {
        ...(first || {}),
        ...(second || {})
      }
    }
  }
}
  
