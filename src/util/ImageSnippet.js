import { hasClass } from './SVG';

export const getSnippet = (image, element) => {
  // Annotation shape could be the element itself or a 
  // child (in case of editable shapes, the element would be 
  // the group with shape + handles)
  const shape = hasClass(element, 'a9s-annotation') ? 
    element : element.querySelector('a9s-annotation');

  const kx = image.naturalWidth / image.width; 
  const ky = image.naturalHeight / image.height; 

  const imageBounds = image.getBoundingClientRect();
  const shapeBounds = shape.getBoundingClientRect();

  const x = shapeBounds.x - imageBounds.x;
  const y = shapeBounds.y - imageBounds.y;
  const { width, height } = shapeBounds;

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