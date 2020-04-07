/** Naive implementation (for now) that expects well-formed xywh=pixel: fragments **/
export const parseFragment = annotation => {
  const selector = annotation.selector('FragmentSelector');
  if (selector) {
    const [ x, y, w, h ] = selector.value.substring(11).split(',').map(parseFloat)
    return { x, y, w, h };
  }
}