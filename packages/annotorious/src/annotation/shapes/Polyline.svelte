<script lang="ts">
  import type { DrawingStyleExpression } from '@annotorious/core';
  import { computeSVGPath, type Geometry, type ImageAnnotation, type PolylineGeometry } from '../../model';
  import { computeStyle } from '../utils/styling';
  
  /** Props **/
  export let annotation: ImageAnnotation;
  export let geom: Geometry;
  export let style: DrawingStyleExpression<ImageAnnotation> | undefined;

  $: computedStyle = computeStyle(annotation, style);

  $: d = computeSVGPath(geom as PolylineGeometry);
</script>

<g class="a9s-annotation" data-id={annotation.id}>
  <path 
    class="a9s-outer"
    style={computedStyle ? 'display:none;' : undefined}
    d={d} />

  <path 
    class="a9s-inner"
    style={computedStyle}
    d={d} />
</g>