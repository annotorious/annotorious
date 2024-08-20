export const isTouch = window && navigator && (
    // @ts-ignore
    'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0
  );
