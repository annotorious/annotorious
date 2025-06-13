<script lang="ts">
  import type { DrawingStyleExpression } from '@annotorious/core';
  import type { Geometry, LineGeometry, ImageAnnotation } from '../../model';
  import { computeStyle } from '../utils/styling';

  /** Props */
  export let annotation: ImageAnnotation;
  export let geom: Geometry;
  export let style: DrawingStyleExpression<ImageAnnotation> | undefined;

  $: computedStyle = computeStyle(annotation, style);

  const { points } = geom as LineGeometry;
  const [[x1, y1], [x2, y2]] = points;
</script>

<g class="a9s-annotation" data-id={annotation.id}>
  <line
    class="a9s-outer"
    style={computedStyle ? 'display:none;' : undefined}
    x1={x1}
    y1={y1}
    x2={x2}
    y2={y2} />

  <line
    class="a9s-inner"
    style={computedStyle}
    x1={x1}
    y1={y1}
    x2={x2}
    y2={y2} />
</g>
