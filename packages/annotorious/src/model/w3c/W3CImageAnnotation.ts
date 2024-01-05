import type { W3CAnnotation, W3CAnnotationTarget } from '@annotorious/core';
import type { FragmentSelector } from './fragment';
import type { SVGSelector } from './svg';

export interface W3CImageAnnotation extends W3CAnnotation {

  target: W3CImageAnnotationTarget | W3CImageAnnotationTarget[];

}

export interface W3CImageAnnotationTarget extends W3CAnnotationTarget {

  selector: W3CImageSelector | W3CImageSelector[];

}

export type W3CImageSelector = FragmentSelector | SVGSelector;
