<script type="ts">
  import type { Geometry, PolygonGeometry } from '../../model';
  
  export let geom: Geometry;

  const { points } = geom as PolygonGeometry;
</script>

<polygon 
  class="a9s-outer"
  points={points.map(xy => xy.join(',')).join(' ')} />

<polygon 
  class="a9s-inner"
  points={points.map(xy => xy.join(',')).join(' ')} />