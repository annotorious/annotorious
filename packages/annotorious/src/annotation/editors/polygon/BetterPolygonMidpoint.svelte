<script lang="ts">
  import { isTouch } from '../../utils';

  /** props **/
  export let x: number;
  export let y: number;
  export let scale: number;

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
    r={handleRadius} />
{:else}
  <g class="a9s-polygon-midpoint">
    <circle 
      class="a9s-polygon-midpoint-buffer"
      cx={x}
      cy={y}
      r={1.75 * handleRadius} 
      on:pointerdown
      on:pointerdown={onPointerDown} />

    <circle 
      class="a9s-polygon-midpoint-dot"
      cx={x} 
      cy={y} 
      r={handleRadius} />
  </g>
{/if}

<style>
  .a9s-polygon-midpoint-buffer {
    fill: transparent;
  }

  .a9s-polygon-midpoint-dot {
    fill: rgba(0, 0, 0, 0.2);
    pointer-events: none;
    stroke: rgba(255, 255, 255, 0.6);
    stroke-width: 1.5px;  
    transition: fill 400ms, stroke 400ms;
    vector-effect: non-scaling-stroke;
  }

  .a9s-polygon-midpoint-dot:hover {
    fill: #1a1a1a;
    stroke: #fff;
  }
</style>