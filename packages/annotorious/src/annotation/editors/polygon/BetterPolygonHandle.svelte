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

  $: handleRadius = 4 / scale;
</script>

{#if isTouch}
  <circle 
    cx={x}
    cy={y}
    r={2 * handleRadius} />
{:else}
  <g class="a9s-better-handle">
    <circle 
      class="a9s-better-handle-buffer"
      cx={x}
      cy={y}
      r={handleRadius + (6 / scale)} 
      on:pointerenter
      on:pointerleave
      on:pointerdown
      on:pointerdown={onPointerDown}
      on:pointerup
      on:pointerup={onPointerUp} />

    {#if selected}
      <circle 
        class="a9s-better-handle-selected"
        cx={x} 
        cy={y} 
        r={handleRadius + (6 / scale)} />
    {/if}

    <circle 
      class={`a9s-better-handle-dot${selected ? ' selected': ''}`}
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
    fill: #fff;
    pointer-events: none;
    stroke: rgba(0, 0, 0, 0.35);
    stroke-width: 1px;
    vector-effect: non-scaling-stroke;
  }

  .a9s-better-handle-dot.selected {
    fill: #1a1a1a;
    stroke: none;
  }

  .a9s-better-handle-selected {
    animation: dash-rotate 350ms linear infinite reverse;
    fill: rgba(255, 255, 255, 0.25);
    stroke: rgba(0, 0, 0, 0.9);
    stroke-dasharray: 2 2;
    stroke-width: 1px;
    pointer-events: none;
    vector-effect: non-scaling-stroke;
  }

  @keyframes dash-rotate {
    0% {
      stroke-dashoffset: 0;
    }
    100% {
      stroke-dashoffset: 4; /* Sum of dash + gap */
    }
  }
</style>