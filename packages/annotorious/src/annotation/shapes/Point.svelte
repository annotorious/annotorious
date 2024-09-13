<script lang="ts">
  import type { DrawingStyleExpression } from '@annotorious/core';
  import { POINT_RADIUS, type Geometry, type ImageAnnotation, type PointGeometry } from '../../model';
  import { computeStyle } from '../utils/styling';

  /** Props **/
  export let annotation: ImageAnnotation;
  export let geom: Geometry;
  export let style: DrawingStyleExpression<ImageAnnotation> | undefined;
  export let viewportScale = 1;

  $: computedStyle = computeStyle(annotation, style);

  const { x, y } = geom as PointGeometry;
</script>

<g class="a9s-annotation" data-id={annotation.id}>
  <circle class="a9s-outer" style={computedStyle ? 'display:none;' : undefined} cx={x} cy={y} r={POINT_RADIUS} />

  <circle class="a9s-inner" style={computedStyle} cx={x} cy={y} r={POINT_RADIUS} scale={viewportScale} />
</g>
