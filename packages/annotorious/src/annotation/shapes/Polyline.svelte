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
    const { startPoint, segments } = geom;
    
    let path = `M ${startPoint[0]},${startPoint[1]}`;
    
    segments.forEach(s => {
      if (s.type === PolylineSegmentType.LINE) {
        path += ` L ${s.endPoint[0]},${s.endPoint[1]}`;
      } else if (s.type === PolylineSegmentType.CURVE && s.controlPoint1 && s.controlPoint2) {
        path += ` C ${s.controlPoint1[0]},${s.controlPoint1[1]} ${s.controlPoint2[0]},${s.controlPoint2[1]} ${s.endPoint[0]},${s.endPoint[1]}`;
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