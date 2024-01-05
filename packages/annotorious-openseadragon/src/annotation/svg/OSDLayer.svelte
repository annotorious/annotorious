<script lang="ts">
  import { onMount } from 'svelte';
  import OpenSeadragon from 'openseadragon';
    
  export let viewer: OpenSeadragon.Viewer;

  // Current layer scale
  let scale = 1;

  // CSS layer transform
  let layerTransform: string;

  const onUpdateViewport = () => {
    const containerWidth = viewer.viewport.getContainerSize().x;

    const zoom = viewer.viewport.getZoom(true);
    const flipped = viewer.viewport.getFlip();

    const p = viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(0, 0), true);
    if (flipped)
      p.x = containerWidth - p.x;
    
    const scaleY = zoom * containerWidth / viewer.world.getContentFactor();
    const scaleX = flipped ? - scaleY : scaleY;
    const rotation = viewer.viewport.getRotation();

    layerTransform = `translate(${p.x}, ${p.y}) scale(${scaleX}, ${scaleY}) rotate(${rotation})`;

    scale = zoom * containerWidth / viewer.world.getContentFactor();
  }

  onMount(() => {
    viewer.addHandler('update-viewport', onUpdateViewport);

    return () => {
      viewer.removeHandler('update-viewport', onUpdateViewport);
    }
  });
</script>

<slot transform={layerTransform} scale={scale} />