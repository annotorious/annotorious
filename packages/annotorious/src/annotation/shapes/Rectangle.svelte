<script type="ts">
  import type { Geometry, RectangleGeometry } from '../../model';
  
  /** Props **/
  export let id: string;
  export let geom: Geometry;

  const { x, y, w, h } = geom as RectangleGeometry;
</script>

<g data-id={id}>
  <rect
    class="a9s-outer"
    x={x} 
    y={y} 
    width={w} 
    height={h} />

  <rect
    class="a9s-inner"
    x={x} 
    y={y} 
    width={w} 
    height={h} />
</g>
