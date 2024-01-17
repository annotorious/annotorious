<script lang="ts">
  import { isTouch } from '../utils';

  /** props **/
  export let x: number;
  export let y: number;
  export let scale: number;
  export let radius: number = 30;

  let touched = false;

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'touch')
      touched = true;
  }

  const onPointerUp = () =>
    touched = false;

  $: handleSize = 10 / scale;
</script>

{#if isTouch}
  <g class="a9s-touch-handle">
    <circle 
      cx={x} 
      cy={y} 
      r={radius / scale}
      class="a9s-touch-halo"
      class:touched={touched}
      on:pointerdown
      on:pointerdown={onPointerDown} 
      on:pointerup={onPointerUp} />

    <rect 
      class={`a9s-handle ${$$props.class || ''}`.trim()}
      x={x - handleSize / 2} 
      y={y - handleSize / 2} 
      width={handleSize} 
      height={handleSize}
      on:pointerdown
      on:pointerdown={onPointerDown} 
      on:pointerup={onPointerUp}  />
  </g>
{:else}
  <rect 
    class={`a9s-handle ${$$props.class || ''}`.trim()}
    x={x - handleSize / 2} 
    y={y - handleSize / 2} 
    width={handleSize} 
    height={handleSize} 
    on:pointerdown />
{/if}

<style>
  .a9s-touch-halo {
    fill: transparent;
    stroke-width: 0;
  }

  .a9s-touch-halo.touched {
    fill: rgba(255, 255, 255, 0.25);
  }


</style>
