import type OpenSeadragon from 'openseadragon';
import type { Theme } from '@annotorious/annotorious/src';
import { detectTheme } from '@annotorious/annotorious/src';

export const setTheme = (viewer: OpenSeadragon.Viewer, theme: Theme) => {
  if (theme === 'auto') {
    // Wait for image to load and then detect theme
    viewer.addHandler('open', event => {
      const itemCount = viewer.world.getItemCount();

      const lastItem = viewer.world.getItemAt(itemCount - 1);
      lastItem.addOnceHandler('fully-loaded-change', event => {
        const { fullyLoaded } = event;

        if (fullyLoaded) {
          // The current image was fully loaded, all tiles rendered
          const canvas = viewer.canvas.querySelector('canvas');
          
          const detected = detectTheme(canvas);
          viewer.element.setAttribute('data-theme', detected);
        }
      })
    });
  } else {
    viewer.element.setAttribute('data-theme', theme);
  }

}