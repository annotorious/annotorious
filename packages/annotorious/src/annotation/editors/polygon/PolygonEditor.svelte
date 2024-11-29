<script lang="ts">
  import { boundsFromPoints } from '../../../model';
  import type { PolygonGeometry, Shape } from '../../../model';
  import { Editor, Handle } from '..';
  import type { PolygonEditorProps } from 'src/annotation/types';

  const {
    shape,
    computedStyle,
    transform,
    viewportScale = 1,
  }: PolygonEditorProps = $props();
  /** Props */

  let geom = $derived(shape.geometry);

  const editor = (polygon: Shape, handle: string, delta: [number, number]) => {
    let points: [number, number][];

    const geom = polygon.geometry as PolygonGeometry;

    if (handle === 'SHAPE') {
      points = geom.points.map(([x, y]) => [x + delta[0], y + delta[1]]);
    } else {
      points = geom.points.map(([x, y], idx) =>
        handle === `HANDLE-${idx}` ? [x + delta[0], y + delta[1]] : [x, y],
      );
    }

    const bounds = boundsFromPoints(points);

    return {
      ...polygon,
      geometry: { points, bounds },
    };
  };
</script>

<Editor {shape} {transform} {editor} on:change on:grab on:release let:grab>
  <polygon
    class="a9s-outer"
    style={computedStyle ? 'display:none;' : undefined}
    onpointerdown={grab('SHAPE')}
    points={geom.points.map((xy) => xy.join(',')).join(' ')}
  />

  <polygon
    class="a9s-inner a9s-shape-handle"
    style={computedStyle}
    onpointerdown={grab('SHAPE')}
    points={geom.points.map((xy) => xy.join(',')).join(' ')}
  />

  {#each geom.points as point, idx}
    <Handle
      onpointerdown={grab(`HANDLE-${idx}`)}
      x={point[0]}
      y={point[1]}
      scale={viewportScale}
    />
  {/each}
</Editor>
