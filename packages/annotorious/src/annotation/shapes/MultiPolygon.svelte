<script lang="ts">
  import type { DrawingStyleExpression } from '@annotorious/core';
  import type { Geometry, ImageAnnotation, MultiPolygonGeometry } from '../../model';
  import { computeStyle } from '../utils/styling';
  
  /** Props **/
  export let annotation: ImageAnnotation;
  export let geom: Geometry;
  export let style: DrawingStyleExpression<ImageAnnotation> | undefined;

  $: computedStyle = computeStyle(annotation, style);

  const { polygons } = geom as MultiPolygonGeometry;
  
  // Helper function to create SVG path data for a polygon with holes
  const createPathData = (polygonElement: {rings: Array<{points: Array<[number, number]>}>}): string => {
    let pathData = '';
    
    // Process each ring
    polygonElement.rings.forEach((ring, index) => {
      // Start a new subpath for this ring
      pathData += index === 0 ? 'M ' : ' M ';
      
      // Add all points
      ring.points.forEach((point, pointIndex) => {
        const [x, y] = point;
        
        if (pointIndex === 0) {
          // First point after the M command
          pathData += `${x},${y}`;
        } else {
          // Subsequent points use L command
          pathData += ` L ${x},${y}`;
        }
      });
      
      // Close this ring
      pathData += ' Z';
    });
    
    return pathData;
  };
</script>

<g class="a9s-annotation" data-id={annotation.id}>
  {#each polygons as polygonElement}
    <path 
      class="a9s-outer"
      style={computedStyle ? 'display:none;' : undefined}
      fill-rule="evenodd"
      d={createPathData(polygonElement)} />

    <path 
      class="a9s-inner"
      style={computedStyle}
      fill-rule="evenodd"
      d={createPathData(polygonElement)} />
  {/each}
</g>