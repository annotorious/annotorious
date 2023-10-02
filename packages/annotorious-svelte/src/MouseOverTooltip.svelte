<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import type { ImageAnnotation } from '@annotorious/annotorious';
  import type { SvelteAnnotator } from '@annotorious/core';

  export let container: Element;

  const anno = getContext<SvelteAnnotator<ImageAnnotation>>('anno');

  const { store, hover } = anno.state;

  let top: number;

  let left: number;

  $: hovered = $hover ? store.getAnnotation($hover) : undefined;
  
  onMount(() => {
    const onPointerMove = (event: PointerEvent) => {
      const { offsetX, offsetY } = event;
      left = offsetX;
      top = offsetY;
    }

    container.addEventListener('pointermove', onPointerMove);

    return () => {
      container.removeEventListener('pointermove', onPointerMove);
    }
  });
</script>

{#if $hover}
  <div 
    class="a9s-tooltip" 
    style={`left:${left}px; top:${top}px;`}>

    <slot />

  </div>
{/if}

<style>
  .a9s-tooltip {
    pointer-events: none;
    position: absolute;
  }
</style>