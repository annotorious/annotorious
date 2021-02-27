const SIM_EVENTS = {
  touchstart: 'mousedown',
  touchmove: 'mousemove',
  touchend: 'mouseup'
}

export const isTouchDevice = () =>
  'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0;

export const enableTouch = el => {

  const touchHandler = evt => {
    const touch = evt.changedTouches[0];

    const simulatedEvent = new MouseEvent(SIM_EVENTS[evt.type], {
      screenX: touch.screenX,
      screenY: touch.screenY,
      clientX: touch.clientX,
      clientY: touch.clientY,
      bubbles: true
    });

    touch.target.dispatchEvent(simulatedEvent);
    evt.preventDefault();
  }

  if (isTouchDevice()) {
    el.addEventListener('touchstart', touchHandler, true);
    el.addEventListener('touchmove', touchHandler, true);
    el.addEventListener('touchend', touchHandler, true);
    el.addEventListener('touchcancel', touchHandler, true);
  };

}