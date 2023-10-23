<script type="ts">
  import type { Geometry, EllipseGeometry } from '../../model';
  
  /** Props */
  export let id: string;
  export let geom: Geometry;

  const { cx, cy, rx, ry } = geom as EllipseGeometry;
</script>

<g data-id={id}>
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
</g>
