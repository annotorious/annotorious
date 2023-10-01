<script type="ts">
  import { onMount } from 'svelte';
  import { draggable } from '@neodrag/svelte';
  import OpenSeadragon from 'openseadragon';
  import type { StoreChangeEvent } from '@annotorious/core';
  import type { ImageAnnotation, ImageAnnotationStore } from '@annotorious/annotorious';

  export let store: ImageAnnotationStore;

  export let viewer: OpenSeadragon.Viewer;

  const { selection } = store; 

  let left: number;

  let top: number;

  let dragged = false;

  let storeObserver: (event: StoreChangeEvent<ImageAnnotation>) => void;

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

    if ($selection) {
      console.log('resetting selection');
      dragged = false;
      setPosition($selection);

      storeObserver = (event: StoreChangeEvent<ImageAnnotation>) => {
        if (!dragged)
          setPosition($selection);
      }

      store.observe(storeObserver, { annotations: $selection });
    } else {
      console.log('deselect');
    }
  }

  const setPosition = (selection: string[]) => {
    // Note: this demo popup only supports a single selection
    const annotation = store.getAnnotation(selection[0]);

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
      if ($selection && !dragged)
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

    {$selection.join(', ')}

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