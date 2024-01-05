import { writable } from 'svelte/store';

const setSize = (image: HTMLImageElement | HTMLCanvasElement, svg: SVGElement) => {
  const { naturalWidth, naturalHeight } = (image as HTMLImageElement);

  if (!naturalWidth && !naturalHeight) {
    // Might be because a) the image has not loaded yet, or b) because it's not 
    // an image element (but maybe a CANVAS etc.)! Allow for both possibilities.
    const { width, height } = image;

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    image.addEventListener('load', event => {
      const img = event.target as HTMLImageElement;
      svg.setAttribute('viewBox', `0 0 ${img.naturalWidth} ${img.naturalHeight}`);
    });
  } else {
    svg.setAttribute('viewBox', `0 0 ${naturalWidth} ${naturalHeight}`);
  }

}

export const enableResponsive = (image: HTMLImageElement | HTMLCanvasElement, svg: SVGSVGElement) => {

  setSize(image, svg);

  const { subscribe, set } = writable(1);

  let resizeObserver: ResizeObserver;

  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      const svgBounds = svg.getBoundingClientRect();

      const { width, height } = svg.viewBox.baseVal;
  
      const scale = Math.max(
        svgBounds.width / width,
        svgBounds.height / height
      );
  
      set(scale);
    });
  
    resizeObserver.observe(svg.parentElement!);
  }

  const destroy = () => {
    if (resizeObserver)
      resizeObserver.disconnect();
  }

  return { destroy, subscribe };

}

