<script lang="ts">
  import { multipolygonElementToPath } from '@annotorious/annotorious';
  import type { ImageAnnotation, MultiPolygonGeometry } from '@annotorious/annotorious';
  
  /** Props **/
  export let annotation: ImageAnnotation;

  const { polygons } = annotation.target.selector.geometry as MultiPolygonGeometry;
</script>

<g>
  {#each polygons as polygonElement}
    <path 
      fill-rule="evenodd"
      d={multipolygonElementToPath(polygonElement)} />

    <path 
      class="a9s-inner"
      fill-rule="evenodd"
      d={multipolygonElementToPath(polygonElement)} />
  {/each}
</g>