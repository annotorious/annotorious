import type { W3CAnnotation, W3CAnnotationTarget } from '@annotorious/core';

export interface W3CImageAnnotation extends W3CAnnotation {

  target: W3CImageAnnotationTarget | W3CImageAnnotationTarget[];

}

export interface W3CImageAnnotationTarget extends W3CAnnotationTarget {

  selector: W3CImageSelector | W3CImageSelector[];

}

export interface FragmentSelector {

  type: 'FragmentSelector';

  conformsTo: 'http://www.w3.org/TR/media-frags/',

  value: string;

}

export interface SVGSelector {

  type: 'SvgSelector';

  value: string;

}

export type W3CImageSelector = FragmentSelector | SVGSelector;
