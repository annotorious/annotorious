export const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

// IE11 doesn't support adding/removing classes to SVG elements except 
// via .setAttribute
export const addClass = (el, className) => {
  const classNames = new Set(el.getAttribute('class').split(' '));
  classNames.add(className);
  el.setAttribute('class', Array.from(classNames).join(' '));
}

export const removeClass = (el, className) => {
  const classNames = el.getAttribute('class').split(' ').filter(c => c !== className);
  el.setAttribute('class', classNames.join(' '));
}