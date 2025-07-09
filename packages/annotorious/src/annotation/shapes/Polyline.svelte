<script lang="ts">
  import type { DrawingStyleExpression } from '@annotorious/core';
  import { computeSVGPath} from '../../model';
  import type { Geometry, ImageAnnotation, PolylineGeometry } from '../../model';
  import { computeStyle } from '../utils/styling';
  
  /** Props **/
  export let annotation: ImageAnnotation;
  export let geom: Geometry;
  export let style: DrawingStyleExpression<ImageAnnotation> | undefined;

  $: computedStyle = computeStyle(annotation, style);

  $: d = computeSVGPath(geom as PolylineGeometry);

  $: cssClass = (geom as PolylineGeometry).closed ? 'closed' : 'open'
</script>

<g class="a9s-annotation" data-id={annotation.id}>
  <path 
    class={`a9s-outer ${cssClass}`}
    style={computedStyle ? 'display:none;' : undefined}
    d={d} />

  <path 
    class={`a9s-inner ${cssClass}`}
    style={computedStyle}
    d={d} />
</g>

<style>
  path.open {
    fill: transparent !important;
  }
</style>