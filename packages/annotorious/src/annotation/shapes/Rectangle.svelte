<script lang="ts">
  import type { DrawingStyleExpression } from '@annotorious/core';
  import type { Geometry, ImageAnnotation, RectangleGeometry } from '../../model';
  import { computeStyle } from '../utils/styling';
  
  /** Props **/
  export let annotation: ImageAnnotation;
  export let geom: Geometry;
  export let style: DrawingStyleExpression<ImageAnnotation> | undefined;

  $: computedStyle = computeStyle(annotation, style);

  $: ({ x, y, w, h } = geom as RectangleGeometry);
</script>

<g class="a9s-annotation" data-id={annotation.id}>
  <rect
    class="a9s-outer"
    style={computedStyle ? 'display:none;' : undefined}
    x={x} 
    y={y} 
    width={w} 
    height={h} />

  <rect
    class="a9s-inner"
    style={computedStyle}
    x={x} 
    y={y} 
    width={w} 
    height={h} />
</g>
