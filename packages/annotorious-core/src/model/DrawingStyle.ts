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

export type DrawingStyleExpression<T extends Annotation> =
  DrawingStyle | ((annotation: T, state?: AnnotationState) => DrawingStyle);
