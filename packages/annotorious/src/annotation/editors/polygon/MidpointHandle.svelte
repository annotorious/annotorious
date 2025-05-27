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

  $: handleRadius = 4 / scale;
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
      class="a9s-polygon-midpoint-outer"
      cx={x} 
      cy={y} 
      r={handleRadius} />

    <circle 
      class="a9s-polygon-midpoint-inner"
      cx={x} 
      cy={y} 
      r={handleRadius} />
  </g>
{/if}

<style>
  .a9s-polygon-midpoint {
    cursor: crosshair;
  }
  
  .a9s-polygon-midpoint-buffer {
    fill: transparent;
  }

  .a9s-polygon-midpoint-outer {
    display: none;
    fill: transparent;
    pointer-events: none;
    stroke: rgba(0, 0, 0, 0.35);
    stroke-width: 1.5px;
    vector-effect: non-scaling-stroke;
  }

  .a9s-polygon-midpoint-inner {
    fill: rgba(0, 0, 0, 0.25);
    pointer-events: none;
    stroke: #fff;
    stroke-width: 1px;  
    vector-effect: non-scaling-stroke;
  }
</style>