<script lang="ts">
  import type { DrawingStyleExpression } from '@annotorious/core';
  import type { Geometry, ImageAnnotation, RectangleGeometry } from '../../model';
  import { computeStyle } from '../utils/styling';
  
  /** Props **/
  export let annotation: ImageAnnotation;
  export let geom: Geometry;
  export let style: DrawingStyleExpression<ImageAnnotation> | undefined;

  $: computedStyle = computeStyle(annotation, style);

  $: ({ x, y, w, h, rot } = geom as RectangleGeometry);

  // Calculate transform for rotation
  $: rectTransform = (rot ?? 0) !== 0 ? 
    `translate(${x + w / 2}, ${y + h / 2}) rotate(${((rot ?? 0) * 180) / Math.PI}) translate(${-(x + w / 2)}, ${-(y + h / 2)})` :
    undefined;
</script>

<g class="a9s-annotation" data-id={annotation.id}>
  <g transform={rectTransform}>
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
</g>
