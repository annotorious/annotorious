<script lang="ts">
  import type { ImageAnnotation, PolygonGeometry } from '@annotorious/annotorious';

  export let annotation: ImageAnnotation;

  $: geom = annotation.target.selector.geometry as PolygonGeometry;
</script>

<polygon points={geom.points.map(xy => xy.join(',')).join(' ')} />