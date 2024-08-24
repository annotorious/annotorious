export const isTouch = (() => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined')
    return false;
  
  return 'ontouchstart' in window || 
         navigator.maxTouchPoints > 0 || 
         // @ts-ignore
         navigator.msMaxTouchPoints > 0;
})();
