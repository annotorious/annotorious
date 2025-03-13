<script lang="ts">
  import type { DrawingStyleExpression } from '@annotorious/core';
  import { multipolygonElementToPath } from '../../model';
  import type { Geometry, ImageAnnotation, MultiPolygonGeometry } from '../../model';
  import { computeStyle } from '../utils/styling';
  
  /** Props **/
  export let annotation: ImageAnnotation;
  export let geom: Geometry;
  export let style: DrawingStyleExpression<ImageAnnotation> | undefined;

  $: computedStyle = computeStyle(annotation, style);

  const { polygons } = geom as MultiPolygonGeometry;
</script>

<g class="a9s-annotation" data-id={annotation.id}>
  {#each polygons as polygonElement}
    <path 
      class="a9s-outer"
      style={computedStyle ? 'display:none;' : undefined}
      fill-rule="evenodd"
      d={multipolygonElementToPath(polygonElement)} />

    <path 
      class="a9s-inner"
      style={computedStyle}
      fill-rule="evenodd"
      d={multipolygonElementToPath(polygonElement)} />
  {/each}
</g>