<script lang="ts">
  import { setContext } from 'svelte';
  import { type SvelteAnnotator, type SvelteAnnotatorState, toSvelteStore } from '@annotorious/core';
  import { createOSDAnnotator, type ImageAnnotation } from '@annotorious/openseadragon';
  import type OpenSeadragon from 'openseadragon';

  /** props **/
  export let viewer: OpenSeadragon.Viewer;
  export let opts = {};
  export let anno: SvelteAnnotator<ImageAnnotation, ImageAnnotation> = undefined;

  $: init(viewer);

  const init = (viewer: OpenSeadragon.Viewer) => {
    if (viewer) {
      const annotator = createOSDAnnotator(viewer, opts);

      // Wrap the store for Svelte reactivity
      const svelteStore = toSvelteStore(annotator.state.store);

      const shim = {
        ...annotator,
        state: {
          ...annotator.state,
          store: svelteStore
        } as SvelteAnnotatorState<ImageAnnotation, ImageAnnotation>
      } as SvelteAnnotator<ImageAnnotation, ImageAnnotation>

      setContext('anno', shim);
      setContext('viewer', viewer);

      anno = shim;
    }
  }
</script>

{#if viewer}
  <slot />
{/if}
