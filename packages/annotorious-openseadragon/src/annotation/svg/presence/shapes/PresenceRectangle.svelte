<script type="ts">
  import type { PresentUser } from '@annotorious/core';
  import type { ImageAnnotation, RectangleGeometry } from '@annotorious/annotorious/src';
  import SVGPresenceLabel from '../SVGPresenceLabel.svelte';

  export let annotation: ImageAnnotation;

  export let user: PresentUser;

  export let scale: number;

  $: geom = annotation.target.selector.geometry as RectangleGeometry;
</script>

<g class="a9s-presence-overlay">
  <SVGPresenceLabel scale={scale} user={user} x={geom.x} y={geom.y} />
  <rect
    class="a9s-presence-shape a9s-presence-rectangle"
    stroke={user.appearance.color}
    fill="transparent"
    x={geom.x} y={geom.y} width={geom.w} height={geom.h} />
</g>

<style>
  rect {
    stroke-width: 1.2;
    vector-effect: non-scaling-stroke;
  }
</style>