const SIM_EVENTS = {
  touchstart: 'mousedown',
  touchmove: 'mousemove',
  touchend: 'mouseup'
}

export const isTouchDevice = () =>
  'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0;

export const enableTouchTranslation = el => {

  let pressAndHoldTrigger = null;

  const simulateEvent = (type, e) => new MouseEvent(type, {
    screenX: e.screenX,
    screenY: e.screenY,
    clientX: e.clientX,
    clientY: e.clientY,
    pageX: e.pageX,
    pageY: e.pageY,
    bubbles: true
  });

  const touchHandler = evt => {
    const touch = evt.changedTouches[0];
    const simulatedEvent = simulateEvent(SIM_EVENTS[evt.type], touch);

    touch.target.dispatchEvent(simulatedEvent);
    evt.preventDefault();

    if (evt.type === 'touchstart' || evt.type === 'touchmove') {
      pressAndHoldTrigger && clearTimeout(pressAndHoldTrigger);

      pressAndHoldTrigger = setTimeout(() => {
        const simulatedEvent = simulateEvent('dblclick', touch);
        touch.target.dispatchEvent(simulatedEvent);
      }, 800);
    }

    if (evt.type === 'touchend')
      pressAndHoldTrigger && clearTimeout(pressAndHoldTrigger);
  }

  el.addEventListener('touchstart', touchHandler, true);
  el.addEventListener('touchmove', touchHandler, true);
  el.addEventListener('touchend', touchHandler, true);
  el.addEventListener('touchcancel', touchHandler, true);

}