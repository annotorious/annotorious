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

    if (fill)
      css += `fill:${fill};`;

    if (fillOpacity || fillOpacity === 0) {
      css += `fill-opacity:${fillOpacity}`;
    } else if (fill) {
      // If we have no fill opacity, but a fill, set default opacity
      css += 'fill-opacity:0.25';
    }

    if (stroke) {
      css += `stroke:${stroke};`;
      css += `stroke-width:${strokeWidth || '1'};`;
      css += `stroke-opacity:${strokeOpacity || '1'};`;
    }

    return css;
  }
};
