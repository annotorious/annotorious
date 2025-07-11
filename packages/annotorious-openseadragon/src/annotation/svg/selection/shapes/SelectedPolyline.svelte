<script lang="ts">
  import { computeSVGPath, type ImageAnnotation, type PolylineGeometry } from '@annotorious/annotorious';

  export let annotation: ImageAnnotation;

  $: geom = annotation.target.selector.geometry as PolylineGeometry;

  $: d = computeSVGPath(geom);
</script>

<path d={d} />