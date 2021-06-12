export const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

const getClassNames = el => {
  const attr = el.getAttribute('class');
  return attr ? new Set(attr.split(' ')) : new Set();
}

// IE11 doesn't support adding/removing classes to SVG elements except 
// via .setAttribute
export const addClass = (el, className) => {
  const classNames = getClassNames(el);
  classNames.add(className);
  el.setAttribute('class', Array.from(classNames).join(' '));
}

export const removeClass = (el, className) => {
  const classNames = getClassNames(el);
  if (classNames.size === 0)
    el.removeAttribute('class');
  else
    el.setAttribute('class', classNames.join(' '));
}

export const hasClass = (el, className) =>
  getClassNames(el).has(className);