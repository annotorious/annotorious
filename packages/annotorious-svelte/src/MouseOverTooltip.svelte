<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import type { ImageAnnotation } from '@annotorious/annotorious';
  import type { SvelteAnnotator } from '@annotorious/core';

  export let container: Element;

  const anno = getContext<SvelteAnnotator<ImageAnnotation>>('anno');

  const { store, hover } = anno.state;

  let top: number;

  let left: number;

  let show = true;

  $: hovered = $hover ? store.getAnnotation($hover) : undefined;
  
  onMount(() => {
    const onPointerEnter = () => {
      show = true;
    }

    const onPointerMove = (event: PointerEvent) => {
      const { offsetX, offsetY } = event;
      left = offsetX;
      top = offsetY;
    }

    const onPointerLeave = () => {
      show = false;
    }

    container.addEventListener('pointerenter', onPointerEnter);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerleave', onPointerLeave);

    return () => {
      container.removeEventListener('pointerenter', onPointerEnter);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);
    }
  });
</script>

{#if $hover && show}
  <div 
    class="a9s-tooltip" 
    style={`left:${left}px; top:${top}px;`}>

    <slot hovered={hovered} />

  </div>
{/if}

<style>
  .a9s-tooltip {
    pointer-events: none;
    position: absolute;
  }
</style>