<script lang="ts">
  import { onMount } from 'svelte';
  import { draggable } from '@neodrag/svelte';
  import OpenSeadragon from 'openseadragon';
  import type { Selection, StoreChangeEvent, SvelteAnnotatorState } from '@annotorious/core';
  import type { ImageAnnotation } from '@annotorious/annotorious';

  export let state: SvelteAnnotatorState<ImageAnnotation, ImageAnnotation>;

  export let viewer: OpenSeadragon.Viewer;

  let left: number;

  let top: number;

  let dragged = false;

  let storeObserver: (event: StoreChangeEvent<ImageAnnotation>) => void;

  const { selection, store } = state; 

  const isSelected = (selection: Selection) => selection.selected?.length > 0;

  const onDragStart = () => {
    dragged = true;
    viewer.setMouseNavEnabled(false);
  }

  const onDragEnd = () => {
    viewer.setMouseNavEnabled(true);
  }

  $: $selection, onSelect();

  const onSelect = () => {
    if (storeObserver)
      store.unobserve(storeObserver);

    if (isSelected($selection)) {
      dragged = false;

      setPosition($selection);

      storeObserver = (event: StoreChangeEvent<ImageAnnotation>) => {
        if (!dragged)
          setPosition($selection);
      }

      store.observe(storeObserver, { annotations: $selection.selected.map(s => s.id) });
    }
  }

  const setPosition = (selection: Selection) => {
    // Note: this demo popup only supports a single selection
    const selectedId = selection.selected[0].id;
    const annotation = store.getAnnotation(selectedId);

    const { minX, minY, maxX, maxY } = annotation.target.selector.geometry.bounds;

    const PADDING = 14;

    const topLeft = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(minX, minY));
    const bottomRight = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(maxX, maxY));

    // [left, top] = defaultStrategy(annotation, lastPointerDown);
    left = bottomRight.x + PADDING;
    top = topLeft.y;
  }

  onMount(() => {
    const onUpdateViewport = () => {
      if (isSelected($selection) && !dragged)
        setPosition($selection);
    }

    viewer.addHandler('update-viewport', onUpdateViewport);

    return () => {
      viewer.removeHandler('update-viewport', onUpdateViewport);
    }
  });
</script>

{#if $selection}
  <div 
    class="a9s-popup a9s-osd-popup"
    use:draggable={{ position: { x: left, y: top }}}
    on:neodrag:start={onDragStart}
    on:neodrag:end={onDragEnd}>
    {$selection.selected.map(s => s.id).join(', ')}
  </div>
{/if}

<style>
  .a9s-osd-popup {
    background-color: #fff;
    border: 1px solid #a2a2a2;
    height: 250px;
    position: absolute;
    width: 400px;
    z-index: 1;
  }
</style>