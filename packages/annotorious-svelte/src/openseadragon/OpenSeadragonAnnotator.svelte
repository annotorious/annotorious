<script lang="ts">
  import { SvelteAnnotatorState, toSvelteStore } from '@annotorious/core';
  import { createOSDAnnotator, ImageAnnotation } from '@annotorious/openseadragon';
  import { setContext } from 'svelte';
  import type OpenSeadragon from 'openseadragon';

  /** props **/
  export let viewer: OpenSeadragon.Viewer;
  export let opts = {};

  $: init(viewer);

  const init = (viewer: OpenSeadragon.Viewer) => {
    if (viewer) {
      const anno = createOSDAnnotator(viewer, opts);

      // Wrap the store for Svelte reactivity
      const svelteStore = toSvelteStore(anno.state.store);

      const shim = {
        ...anno,
        state: {
          ...anno.state,
          store: svelteStore
        } as SvelteAnnotatorState<ImageAnnotation>
      }

      setContext('anno', shim);
      setContext('viewer', viewer);
    }
  }
</script>

{#if viewer}
  <slot />
{/if}
