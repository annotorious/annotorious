<script type="ts">
  import type { Geometry, PolygonGeometry } from '../../model';
  
  /** Props **/
  export let id: string;
  export let geom: Geometry;

  const { points } = geom as PolygonGeometry;
</script>

<g data-id={id}>
  <polygon 
    class="a9s-outer"
    points={points.map(xy => xy.join(',')).join(' ')} />

  <polygon 
    class="a9s-inner"
    points={points.map(xy => xy.join(',')).join(' ')} />
</g>