<script lang="ts">
  import { boundsFromPoints } from '../../../model';
  import type { Polygon, PolygonGeometry, Shape } from '../../../model';
  import type { Transform } from '../../Transform';
  import { Editor, Handle } from '..';

  /** Props */
  export let shape: Polygon;
  export let computedStyle: string | undefined;
  export let transform: Transform;
  export let viewportScale: number = 1;

  $: geom = shape.geometry;

  const editor = (polygon: Shape, handle: string, delta: [number, number]) => {
    let points: [number, number][];

    const geom = (polygon.geometry) as PolygonGeometry;

    if (handle === 'SHAPE') {
      points = geom.points.map(([x, y]) => [x + delta[0], y + delta[1]]);
    } else {
      points = geom.points.map(([x, y], idx) =>
        handle === `HANDLE-${idx}` ? [x + delta[0], y + delta[1]] : [x, y]
      );
    }

    const bounds = boundsFromPoints(points);

    return {
      ...polygon,
      geometry: { points, bounds }
    }
  }
</script>

<Editor
  shape={shape}
  transform={transform}
  editor={editor}
  on:change 
  on:grab
  on:release
  let:grab={grab}>

  <polygon
    class="a9s-outer"
    style={computedStyle ? 'display:none;' : undefined}
    on:pointerdown={grab('SHAPE')}
    points={geom.points.map(xy => xy.join(',')).join(' ')} />

  <polygon
    class="a9s-inner a9s-shape-handle"
    style={computedStyle}
    on:pointerdown={grab('SHAPE')}
    points={geom.points.map(xy => xy.join(',')).join(' ')} />

  {#each geom.points as point, idx}
    <Handle 
      on:pointerdown={grab(`HANDLE-${idx}`)}
      x={point[0]} y={point[1]} 
      scale={viewportScale} />
  {/each}
</Editor>