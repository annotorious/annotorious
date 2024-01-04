import type { Theme } from '../../AnnotoriousOpts';

export const sampleBrightness = (imageOrCanvas: HTMLElement) => {

  let canvas: HTMLCanvasElement;

  let context: CanvasRenderingContext2D;

  if (imageOrCanvas.nodeName === 'CANVAS') {
    canvas = imageOrCanvas as HTMLCanvasElement;
    context = canvas.getContext('2d', { willReadFrequently: true })!;
  } else {
    const img = imageOrCanvas as HTMLImageElement;
    // Copy image to in-memory canvas for processing
    canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    context = canvas.getContext('2d', { willReadFrequently: true })!;
    context.drawImage(img, 0, 0, img.width, img.height);
  }

  let totalBrightness = 0;

  // Sample a grid of points spaced 10% width/height apart (= 9 x 9 samples)
  for (let i = 1; i < 10; i++) {
    for (let j = 1; j < 10; j++) {
      const x = Math.round(j * canvas.width / 10);
      const y = Math.round(i * canvas.height / 10);

      const pixelData = context.getImageData(x, y, 1, 1).data;
      const brightness = (0.299 * pixelData[0] + 0.587 * pixelData[1] + 0.114 * pixelData[2]) / 255;
      totalBrightness += brightness;
    }
  }

  return totalBrightness / 81;
}

export const detectTheme = (imageOrCanvas: HTMLElement) => {
  const brightness = sampleBrightness(imageOrCanvas);
  const theme = brightness > 0.6 ? 'dark' : 'light'

  console.log(`[Annotorious] Image brightness: ${brightness.toFixed(1)}. Setting ${theme} theme.`);

  return theme;
}

export const setTheme = (imageOrCanvas: HTMLElement, container: HTMLElement, theme: Theme) =>
  container.setAttribute('data-theme', theme === 'auto' ? detectTheme(imageOrCanvas) : theme);