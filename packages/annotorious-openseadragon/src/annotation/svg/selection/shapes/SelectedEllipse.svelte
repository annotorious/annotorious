<script lang="ts">
  import type { ImageAnnotation, EllipseGeometry } from '@annotorious/annotorious';

  export let annotation: ImageAnnotation;

  $: geom = annotation.target.selector.geometry as EllipseGeometry;
</script>

<ellipse cx={geom.cx} cy={geom.cy} rx={geom.rx} ry={geom.ry} />