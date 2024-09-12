<script lang="ts">
  import type { DrawingStyleExpression } from '@annotorious/core';
  import type { Geometry, ImageAnnotation, PointGeometry } from '../../model';
  import { computeStyle } from '../utils/styling';

  /** Props **/
  export let annotation: ImageAnnotation;
  export let geom: Geometry;
  export let style: DrawingStyleExpression<ImageAnnotation> | undefined;
  $: computedStyle = computeStyle(annotation, style);

  const { x, y } = geom as PointGeometry;
</script>

<g class="a9s-annotation" data-id={annotation.id}>
  <circle
    class="a9s-outer"
    style={computedStyle ? 'display:none;' : undefined}
    cx={x}
    cy={y}
    r={5}
  />

  <circle class="a9s-inner" style={computedStyle} cx={x} cy={y} r={5} />
</g>
