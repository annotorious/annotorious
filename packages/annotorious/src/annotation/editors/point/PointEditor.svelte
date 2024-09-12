<script lang="ts">
  import {
    boundsFromPoint,
    boundsFromPoints,
    POINT_RADIUS,
  } from '../../../model';
  import type { Point, PointGeometry, Shape } from '../../../model';
  import type { Transform } from '../../Transform';
  import { Editor, Handle } from '..';

  /** Props */
  export let shape: Point;
  export let computedStyle: string | undefined;
  export let transform: Transform;

  $: geom = shape.geometry;

  const editor = (point: Shape, handle: string, delta: [number, number]) => {
    const geom = point.geometry as PointGeometry;

    const { x, y } = geom;
    const [dx, dy] = delta;

    const pointTranslated = {
      x: x + dx,
      y: y + dy,
    };

    const bounds = boundsFromPoint(pointTranslated.x, pointTranslated.y);

    return {
      ...point,
      geometry: { ...pointTranslated, bounds },
    };
  };
</script>

<Editor {shape} {transform} {editor} on:change on:grab on:release let:grab>
  <circle
    class="a9s-outer"
    style="fill:yellow;stroke:darkgoldenrod;"
    on:pointerdown={grab('SHAPE')}
    cx={geom.x}
    cy={geom.y}
    r={POINT_RADIUS}
  />

  <circle
    class="a9s-inner a9s-shape-handle"
    style="fill:yellow;stroke:darkgoldenrod;"
    on:pointerdown={grab('SHAPE')}
    cx={geom.x}
    cy={geom.y}
    r={POINT_RADIUS}
  />
</Editor>
