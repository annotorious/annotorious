<script type="ts">
  import type { DrawingStyle } from '@annotorious/core';
  import type { Geometry, EllipseGeometry, ImageAnnotation } from '../../model';
  import { computeStyle } from '../utils/styling';
  
  /** Props */
  export let annotation: ImageAnnotation;
  export let geom: Geometry;
  export let style: DrawingStyle | ((annotation: ImageAnnotation) => DrawingStyle) = undefined;

  $: computedStyle = computeStyle(annotation, style);

  const { cx, cy, rx, ry } = geom as EllipseGeometry;
</script>

<g data-id={annotation.id}>
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
