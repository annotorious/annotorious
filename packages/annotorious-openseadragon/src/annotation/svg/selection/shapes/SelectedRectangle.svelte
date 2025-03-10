<script lang="ts">
  import type { ImageAnnotation, RectangleGeometry } from '@annotorious/annotorious';

  export let annotation: ImageAnnotation;

  $: geom = annotation.target.selector.geometry as RectangleGeometry;
</script>

<rect x={geom.x} y={geom.y} width={geom.w} height={geom.h} />