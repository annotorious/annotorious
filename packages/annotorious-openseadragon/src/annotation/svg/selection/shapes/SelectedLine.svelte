<script lang="ts">
  import type { ImageAnnotation, LineGeometry } from '@annotorious/annotorious';

  export let annotation: ImageAnnotation;

  $: geom = annotation.target.selector.geometry as LineGeometry;
</script>

<line x1={geom.points[0][0]} y1={geom.points[0][1]} x2={geom.points[1][0]} y2={geom.points[1][1]} />