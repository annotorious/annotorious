<script lang="ts">
  import type { PresentUser } from '@annotorious/core';

  export let x: number;

  export let y: number;

  export let user: PresentUser;

  export let scale: number;

  export let hAlign: 'CENTER' | null = null;

  let g: SVGGElement;

  $: if (g) setWidth(scale);

  const setWidth = (scale: number) => {
    const textEl = g.querySelector('text');
    const rectEl = g.querySelector('rect');

    const width = textEl!.getBBox().width + 10 / scale;

    if (hAlign === 'CENTER') {
      g.setAttribute('style', `transform: translateX(-${width / 2}px)`);
    }

    rectEl!.setAttribute('width', `${width}`);
  }
</script>

<g bind:this={g} class="a9s-presence-label">
  <rect
    class="a9s-presence-label-bg" 
    x={x} 
    y={y - 18 / scale} 
    height={18 / scale} 
    fill={user.appearance.color}
    stroke={user.appearance.color} />

  <text font-size={12 / scale} x={x + Math.round(5 / scale)} y={y - 5 / scale}>{user.appearance.label}</text>
</g>

<style>
  text {
    fill: #fff;
    font-family: Arial, Helvetica, sans-serif;
    font-weight: 600;
  }

  rect {
    stroke-width: 1.2;
    vector-effect: non-scaling-stroke;
  }
</style>