/** 
 * Convert a pointer event's screen position into the element's offset
 * coordinates.
 */
export const getOffsetPoint = (el: Element, evt: PointerEvent): [number, number] => {
  const { left, top, width, height } = el.getBoundingClientRect();

  return [
    (evt.clientX - left) * (el.clientWidth / width),
    (evt.clientY - top) * (el.clientHeight / height)
  ];
}
