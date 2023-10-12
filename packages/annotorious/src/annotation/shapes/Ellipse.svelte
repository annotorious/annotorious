<script type="ts">
  import type { Geometry, EllipseGeometry } from '../../model';
  
  export let geom: Geometry;

  const { cx, cy, rx, ry } = geom as EllipseGeometry;
</script>

<ellipse
  class="a9s-outer"
  cx={cx} 
  cy={cy} 
  rx={rx} 
  ry={ry} />

<ellipse
  class="a9s-inner"
  cx={cx} 
  cy={cy} 
  rx={rx} 
  ry={ry} />
