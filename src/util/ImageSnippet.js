import { hasClass } from './SVG';

export const getSnippet = (image, element) => {
  const shape = hasClass(element, '.a9s-annotation') ? 
    element : element.closest('.a9s-annotation');

  const outer = shape.querySelector('.a9s-outer');

  const kx = image.naturalWidth / image.width;
  const ky = image.naturalHeight / image.height;

  const imageBounds = image.getBoundingClientRect();
  const outerBounds = outer.getBoundingClientRect();

  const x = outerBounds.x - imageBounds.x;
  const y = outerBounds.y - imageBounds.y;
  const { width, height } = outerBounds;

  // Cut out the image snippet as in-memory canvas element
  const snippet = document.createElement('CANVAS');
  const ctx = snippet.getContext('2d');
  snippet.width = width * kx;
  snippet.height = height * ky;
  ctx.drawImage(image, x * kx, y * ky, width * kx, height * ky, 0, 0, width * kx, height * ky);

  return {
    snippet,
    transform: xy => {
      const px = x * kx + xy[0];
      const py = y * ky + xy[1];
      return [ px, py ];
    }
  };
}