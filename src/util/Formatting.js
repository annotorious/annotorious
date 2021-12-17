import { addClass, SVG_NAMESPACE } from './SVG';

const isFirefox = /firefox/i.test(navigator.userAgent);

const formatSvgEl = (svgEl, x, y, w, h) => {
  svgEl.setAttribute('width', w);
  svgEl.setAttribute('height', h);

  // Argh - Firefox produces broken SVG bounds for nested SVG
  if (isFirefox) {
    svgEl.setAttribute('x', 0);
    svgEl.setAttribute('y', 0);
    svgEl.setAttribute('transform', `translate(${x}, ${y})`);  
  } else {
    svgEl.setAttribute('x', x);
    svgEl.setAttribute('y', y);
  }
}

const appendFormatterEl = (formatterEl, shape) => {
  const { x, y, width, height } = shape.getBBox();

  const svgEl = document.createElementNS(SVG_NAMESPACE, 'svg');
  svgEl.setAttribute('class', 'a9s-formatter-el');

  formatSvgEl(svgEl, x, y, width, height);

  const g = document.createElementNS(SVG_NAMESPACE, 'g');
  g.appendChild(formatterEl);y

  svgEl.appendChild(g);
  
  shape.append(svgEl);
}

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
export const format = (shape, annotation, formatters) => {
  // The formatter can be undefined
  if (!formatters)
    return shape;

  // Merge outputs from all formatter functions into one object
  const format = formatters.reduce((merged, fn) => {
    const format = fn(annotation);

    if (!format)
      return merged;

    if (typeof format === 'string' || format instanceof String) {
      merged.className = merged.className ? `${merged.className} ${format}` : format; 
    } else if (format.nodeType === Node.ELEMENT_NODE) {
      merged.elements = merged.elements ? [...merged.elements, format] : [format];
    } else {
      const { className, style, element } = format;

      if (className)
        merged.className = merged.className ? `${merged.className} ${className}` : className;

      if (style)
        merged.style = merged.style ? `${merged.style} ${style}` : style;

      if (element)
        merged.elements = merged.elements ? [...merged.elements, element] : [element];
    }

    // Copy data attributes
    for (const key in format) {
      if (format.hasOwnProperty(key) && key.startsWith('data-')) {
        merged[key] = format[key];
      }
    }

    return merged;
  }, {});

  const { className, style, elements } = format;

  if (className)
    addClass(shape, className);

  if (style) {
    const outer = shape.querySelector('.a9s-outer');
    const inner = shape.querySelector('.a9s-inner');

    if (outer && inner) {
      outer.setAttribute('style', 'display:none');
      inner.setAttribute('style', style);
    } else {
      shape.setAttribute('style', style);
    }
  }

  if (elements)
    elements.forEach(el => appendFormatterEl(el, shape));

  for (const key in format) {
    if (format.hasOwnProperty(key) && key.startsWith('data-')) {
      shape.setAttribute(key, format[key]);
    }
  }
}

export const setFormatterElSize = (group, x, y, w, h) => {
  const formatterEl = group.querySelector('.a9s-formatter-el');
  if (formatterEl)
    formatSvgEl(formatterEl, x, y, w, h);
}