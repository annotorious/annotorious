<script lang="ts">
  import type { DrawingStyleExpression } from '@annotorious/core';
  import type { Geometry, ImageAnnotation } from '../../model';
  import { computeStyle } from '../utils/styling';
  
  // Define the polyline geometry type based on our earlier design
  enum SegmentType {
    LINE = 'line',
    CURVE = 'curve'
  }

  interface PolylineSegment {
    type: SegmentType;
    endPoint: [number, number];
    controlPoint1?: [number, number];
    controlPoint2?: [number, number];
  }

  interface PolylineGeometry extends Geometry {
    startPoint: [number, number];
    segments: PolylineSegment[];
  }
  
  /** Props **/
  export let annotation: ImageAnnotation;
  export let geom: Geometry;
  export let style: DrawingStyleExpression<ImageAnnotation> | undefined;

  $: computedStyle = computeStyle(annotation, style);

  const { startPoint, segments } = geom as PolylineGeometry;

  // Generate SVG path string from polyline geometry
  $: pathString = (() => {
    if (!startPoint || segments.length === 0) return '';
    
    let path = `M ${startPoint[0]},${startPoint[1]}`;
    
    segments.forEach(segment => {
      if (segment.type === SegmentType.LINE) {
        path += ` L ${segment.endPoint[0]},${segment.endPoint[1]}`;
      } else if (segment.type === SegmentType.CURVE && segment.controlPoint1 && segment.controlPoint2) {
        path += ` C ${segment.controlPoint1[0]},${segment.controlPoint1[1]} ${segment.controlPoint2[0]},${segment.controlPoint2[1]} ${segment.endPoint[0]},${segment.endPoint[1]}`;
      } else {
        // Fallback to line if curve data is incomplete
        path += ` L ${segment.endPoint[0]},${segment.endPoint[1]}`;
      }
    });
    
    return path;
  })();
</script>

<g class="a9s-annotation" data-id={annotation.id}>
  <path 
    class="a9s-outer"
    style={computedStyle ? 'display:none;' : undefined}
    d={pathString} />

  <path 
    class="a9s-inner"
    style={computedStyle}
    d={pathString} />
</g>