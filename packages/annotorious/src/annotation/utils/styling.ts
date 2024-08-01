import type { DrawingStyleExpression } from '@annotorious/core';
import type { ImageAnnotation } from '../../model';

export const computeStyle = (
  annotation: ImageAnnotation,
  style?: DrawingStyleExpression<ImageAnnotation>
) => {
  const computed = typeof style === 'function' ? style(annotation) : style;

  if (computed) {
    const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity } = computed;

    let css = '';

    if (fill) {
      css += `fill:${fill};`;
      css += `fill-opacity:${fillOpacity || '0.25'};`;
    }

    if (stroke) {
      css += `stroke:${stroke};`;
      css += `stroke-width:${strokeWidth || '1'};`;
      css += `stroke-opacity:${strokeOpacity || '1'};`;
    }

    return css;
  }
};
