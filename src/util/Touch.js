import * as Hammer from 'hammerjs';

const SIM_EVENTS = {
  touchstart: 'mousedown',
  touchmove: 'mousemove',
  touchend: 'mouseup',
  press: 'dblclick'
}

export const isTouchDevice = () =>
  'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0;

export const enableTouch = el => {

  const simulateEvent = (type, e) => new MouseEvent(type, {
    screenX: e.screenX,
    screenY: e.screenY,
    clientX: e.clientX,
    clientY: e.clientY,
    bubbles: true
  });

  const touchHandler = evt => {
    const touch = evt.changedTouches[0];
    const simulatedEvent = simulateEvent(SIM_EVENTS[evt.type], touch);
    touch.target.dispatchEvent(simulatedEvent);
    evt.preventDefault();
  }

  const pressAndHoldHandler = evt => {
    const { srcEvent } = evt;
    const simulatedEvent = simulateEvent(SIM_EVENTS[evt.type], srcEvent);
    srcEvent.target.parentNode.dispatchEvent(simulatedEvent);
    srcEvent.preventDefault();
  }

    // Handle double taps via hammer.js
    const manager = new Hammer.Manager(el);
    manager.add(new Hammer.Press({
      time: 400
    }));

  el.addEventListener('touchstart', touchHandler, true);
  el.addEventListener('touchmove', touchHandler, true);
  el.addEventListener('touchend', touchHandler, true);
  el.addEventListener('touchcancel', touchHandler, true);

  manager.on('press', pressAndHoldHandler);

}