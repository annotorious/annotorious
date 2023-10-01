import type { Annotation } from './Annotation';

type RGB = `rgb(${number}, ${number}, ${number})`;

type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;

type HEX = `#${string}`;

export type Color = RGB | RGBA | HEX;

export interface DrawingStyle {

  fill?: Color;

  fillOpacity?: number;

}

export type Formatter = <T extends Annotation = Annotation>(annotation: T, isSelected?: boolean) => DrawingStyle;