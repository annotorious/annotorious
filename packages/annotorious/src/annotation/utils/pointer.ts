// Convert a pointer event's screen position into the element's local,
// layout-space coordinates (the native offsetX/offsetY contract). Needed for
// synthetic events, which don't carry offsetX/offsetY, while staying correct
// when an ancestor CSS transform makes the bounding box differ from the
// layout box.
export const getElementPoint = (el: Element, evt: PointerEvent): [number, number] => {
  const { left, top, width, height } = el.getBoundingClientRect();

  return [
    (evt.clientX - left) * (el.clientWidth / width),
    (evt.clientY - top) * (el.clientHeight / height)
  ];
}
