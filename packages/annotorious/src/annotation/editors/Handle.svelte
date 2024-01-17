<script lang="ts">
  import { isTouch } from '../utils';

  export let x: number;
  export let y: number;
  export let scale: number;
  export let radius: number = 30;

  $: handleSize = 10 / scale;
</script>

{#if isTouch}
  <circle 
    cx={x} 
    cy={y} 
    r={radius / scale}
    on:pointerdown  />

  <rect 
    class={$$props.class}}
    x={x - handleSize / 2} 
    y={y - handleSize / 2} 
    width={handleSize} 
    height={handleSize} />
{:else}
  <rect 
    class={$$props.class}}
    x={x - handleSize / 2} 
    y={y - handleSize / 2} 
    width={handleSize} 
    height={handleSize} />
{/if}

<style>
  circle {
    fill: green;
  }

  rect {
    pointer-events: none;
  }
</style>
