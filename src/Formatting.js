import { addClass } from './SVG';

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
export const format = (element, annotation, formatter) => {
  // The formatter can be undefined
  if (!formatter)
    return element;

  const format = formatter(annotation);

  if (typeof format === 'string' || format instanceof String) {
    // Apply CSS class
    addClass(element, format); 
  } else {
    const { className, style } = format;

    if (className)
      addClass(element, className);

    if (style)
      element.setAttribute('style', style);

    for (const key in format) {
      if (format.hasOwnProperty(key) && key.startsWith('data-')) {
        element.setAttribute(key, format[key]);
      }
    }
  }
}