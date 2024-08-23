<script lang="ts">
  import type { DrawingStyleExpression } from '@annotorious/core';
  import type { Geometry, EllipseGeometry, ImageAnnotation } from '../../model';
  import { computeStyle } from '../utils/styling';
  
  /** Props */
  export let annotation: ImageAnnotation;
  export let geom: Geometry;
  export let style: DrawingStyleExpression<ImageAnnotation> | undefined;

  $: computedStyle = computeStyle(annotation, style);

  const { cx, cy, rx, ry } = geom as EllipseGeometry;
</script>

<g class="a9s-annotation" data-id={annotation.id}>
  <ellipse
    class="a9s-outer"
    style={computedStyle ? 'display:none;' : undefined}
    cx={cx} 
    cy={cy} 
    rx={rx} 
    ry={ry} />

  <ellipse
    class="a9s-inner"
    style={computedStyle}
    cx={cx} 
    cy={cy} 
    rx={rx} 
    ry={ry} />
</g>
