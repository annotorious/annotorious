import type OpenSeadragon from 'openseadragon';
import type { Theme } from '@annotorious/annotorious/src';
import { setTheme as _setTheme } from '@annotorious/annotorious/src';

export const setTheme = (viewer: OpenSeadragon.Viewer, theme: Theme) => {

  // TODO wait for image canvas to load.
  viewer.addHandler('open', event => {
    const itemCount = viewer.world.getItemCount();

    const lastItem = viewer.world.getItemAt(itemCount - 1);
    lastItem.addOnceHandler('fully-loaded-change', event => {
      const { fullyLoaded } = event;

      if (fullyLoaded) {
        // The current image was fully loaded, all tiles rendered
        const canvas = viewer.canvas.querySelector('canvas');
        _setTheme(canvas, viewer.element, theme);
      }
    })
  });

}