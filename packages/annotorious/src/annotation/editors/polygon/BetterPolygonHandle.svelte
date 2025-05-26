<script lang="ts">
  import { isTouch } from '../../utils';

  /** props **/
  export let x: number;
  export let y: number;
  export let scale: number;
  export let selected: Boolean | undefined = undefined;

  let touched = false;

  const onPointerDown = (evt: PointerEvent) => {
    if (evt.pointerType === 'touch')
      touched = true;
  }

  const onPointerUp = () =>
    touched = false;

  $: handleRadius = 4.5 / scale;
</script>

{#if isTouch}
  <circle 
    cx={x}
    cy={y}
    r={1.75 * handleRadius} />
{:else}
  <g class="a9s-better-handle">
    <circle 
      class="a9s-better-handle-buffer"
      cx={x}
      cy={y}
      r={1.75 * handleRadius} 
      on:pointerenter
      on:pointerleave
      on:pointerdown
      on:pointerdown={onPointerDown}
      on:pointerup
      on:pointerup={onPointerUp} />

    <circle 
      class={`a9s-better-handle-dot${selected ? ' selected' : ''}`}
      cx={x} 
      cy={y} 
      r={handleRadius} />
  </g>
{/if}

<style>
  .a9s-better-handle-buffer {
    fill: transparent;
  }

  .a9s-better-handle-dot {
    fill: #1a1a1a;
    pointer-events: none;
    stroke: #fff;
    stroke-width: 1.5px;
    vector-effect: non-scaling-stroke;
  }

  .a9s-better-handle-dot.selected {
    fill: #fff;
  }
</style>