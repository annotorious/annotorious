export const parseSVGFragment = annotation => {
  const selector = annotation.selector('SvgSelector');
  if (selector) {
    const { value } = selector;
    var parser = new DOMParser();
    var doc = parser.parseFromString(value, "image/svg+xml");
    return doc.firstChild.firstChild;
  }
}

export const drawPolygon = annotation => {
  return parseSVGFragment(annotation);
}