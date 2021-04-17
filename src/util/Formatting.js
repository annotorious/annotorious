import { addClass, SVG_NAMESPACE } from './SVG';

/**
 * A formatter is a user-defined function that takes an annotation as input,
 * and returns either a string, or an object. If a string is returned, this
 * will be appended to the annotation element CSS class list. Otherwise, the
 * object can have the following properties: 
 * 
 * - 'className' added to the CSS class list
 * - 'data-*' added as data attributes
 * - 'style' a list of CSS styles (in the form of a string) 
 */
export const format = (shape, annotation, formatter) => {
  // The formatter can be undefined
  if (!formatter)
    return shape;

  const format = formatter(annotation);

  // The formatter is allowed to return null
  if (!format)
    return shape;

  if (typeof format === 'string' || format instanceof String) {
    // Apply CSS class
    addClass(shape, format); 
  } else {
    const { className, style, element } = format;

    if (className)
      addClass(shape, className);

    if (style)
      shape.setAttribute('style', style);

    if (element) {
      const { x, y, width, height } = shape.getBBox();

      const container = document.createElementNS(SVG_NAMESPACE, 'svg');
      container.setAttribute('class', 'a9s-formatter-el');
      container.setAttribute('x', x);
      container.setAttribute('y', y);
      container.setAttribute('width', width);
      container.setAttribute('height', height);

      container.appendChild(element);
      shape.append(container);
    }

    for (const key in format) {
      if (format.hasOwnProperty(key) && key.startsWith('data-')) {
        shape.setAttribute(key, format[key]);
      }
    }
  }
}