<script lang="ts">
  import type { PresentUser } from '@annotorious/core';
  import { POINT_RADIUS, type ImageAnnotation, type PointGeometry } from '@annotorious/annotorious/src';
  import SVGPresenceLabel from '../SVGPresenceLabel.svelte';

  export let annotation: ImageAnnotation;

  export let user: PresentUser;

  export let scale: number;

  $: geom = annotation.target.selector.geometry as PointGeometry;

  $: origin = [geom.x, geom.y];

  console.log(POINT_RADIUS / scale);
</script>

<g class="a9s-presence-overlay">
  <SVGPresenceLabel {scale} {user} x={origin[0]} y={origin[1]} hAlign="CENTER" />

  <circle
    class="a9s-presence-shape a9s-presence-point"
    stroke={user.appearance.color}
    fill="transparent"
    cx={origin[0]}
    cy={origin[1]}
    r={POINT_RADIUS}
    {scale}
  />
</g>

<style>
  circle {
    stroke-width: 1.2;
    vector-effect: non-scaling-stroke;
  }
</style>
