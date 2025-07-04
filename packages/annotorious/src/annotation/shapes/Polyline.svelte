<script lang="ts">
  import type { DrawingStyleExpression } from '@annotorious/core';
  import type { Geometry, ImageAnnotation, PolylineGeometry } from '../../model';
  import { PolylineSegmentType } from '../../model';
  import { computeStyle } from '../utils/styling';
  
  /** Props **/
  export let annotation: ImageAnnotation;
  export let geom: Geometry;
  export let style: DrawingStyleExpression<ImageAnnotation> | undefined;

  $: computedStyle = computeStyle(annotation, style);

  const computePath = (geom: PolylineGeometry) => {
    const { start, segments } = geom;
    
    let path = `M ${start[0]},${start[1]}`;
    
    segments.forEach(s => {
      if (s.type === PolylineSegmentType.LINE) {
        path += ` L ${s.end[0]},${s.end[1]}`;
      } else if (s.type === PolylineSegmentType.CURVE && s.cp1 && s.cp2) {
        path += ` C ${s.cp1[0]},${s.cp1[1]} ${s.cp2[0]},${s.cp2[1]} ${s.end[0]},${s.end[1]}`;
      }
    });
    
    return path;
  }

  $: d = computePath(geom as PolylineGeometry);
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