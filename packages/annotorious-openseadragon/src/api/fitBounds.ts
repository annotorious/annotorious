import type { ImageAnnotationStore } from '@annotorious/annotorious';
import type OpenSeadragon from 'openseadragon';

export interface FitboundsOptions {

  immediately?: boolean;

  padding?: number | [number, number, number, number]

}

const _fitBounds = (
  viewer: OpenSeadragon.Viewer,
  store: ImageAnnotationStore,
  fn: string
) => (arg: { id: string } | string, opts: FitboundsOptions = {}) => {
  const id = typeof arg === 'string' ? arg : arg.id;

  const annotation = store.getAnnotation(id);
  if  (!annotation)
    return;

  const containerBounds = viewer.container.getBoundingClientRect();

  const { padding } = opts;

  let [pt, pr, pb, pl] = padding ? (
    Array.isArray(padding) ? padding : [ padding, padding, padding, padding ]
  ) : [0, 0, 0, 0];

  // Relative padding
  pt = pt / containerBounds.height;
  pr = pr / containerBounds.width;
  pb = pb / containerBounds.height;
  pl = pl / containerBounds.width;

  const { minX, minY, maxX, maxY } = annotation.target.selector.geometry.bounds;

  const w = maxX - minX;
  const h = maxY - minY;

  const padX = minX - pl * w;
  const padY = minY - pt * h;
  const padW = w + (pr + pl) * w;
  const padH = h + (pt + pb) * h;

  const rect = viewer.viewport.imageToViewportRectangle(padX, padY, padW, padH);

  // @ts-ignore
  viewer.viewport[fn](rect, opts.immediately);
} 

export const fitBounds = (
  viewer: OpenSeadragon.Viewer,
  store: ImageAnnotationStore
) => _fitBounds(viewer, store, 'fitBounds');

export const fitBoundsWithConstraints = (
  viewer: OpenSeadragon.Viewer,
  store: ImageAnnotationStore
) => _fitBounds(viewer, store, 'fitBoundsWithConstraints');
