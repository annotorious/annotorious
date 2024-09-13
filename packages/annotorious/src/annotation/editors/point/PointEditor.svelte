<script lang="ts">
  import { boundsFromPoint, POINT_RADIUS } from '../../../model';
  import type { Point, PointGeometry, Shape } from '../../../model';
  import type { Transform } from '../../Transform';
  import { Editor, Handle } from '..';

  /** Props */
  export let shape: Point;
  export let computedStyle: string | undefined;
  export let transform: Transform;
  export let viewportScale: number = 1;
  console.log(viewportScale);

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
    style={computedStyle ? 'display:none;' : undefined}
    on:pointerdown={grab('SHAPE')}
    cx={geom.x}
    cy={geom.y}
    r={POINT_RADIUS}
    scale={viewportScale}
  />

  <circle
    class="a9s-inner a9s-shape-handle"
    style={computedStyle}
    on:pointerdown={grab('SHAPE')}
    cx={geom.x}
    cy={geom.y}
    r={POINT_RADIUS}
    scale={viewportScale}
  />

  <Handle x={geom.bounds.minX} y={geom.bounds.minY} scale={viewportScale * 2} on:pointerdown={grab('SHAPE')} />
  <Handle x={geom.bounds.maxX} y={geom.bounds.maxY} scale={viewportScale * 2} on:pointerdown={grab('SHAPE')} />
  <Handle x={geom.bounds.minX} y={geom.bounds.maxY} scale={viewportScale * 2} on:pointerdown={grab('SHAPE')} />
  <Handle x={geom.bounds.maxX} y={geom.bounds.minY} scale={viewportScale * 2} on:pointerdown={grab('SHAPE')} />
</Editor>
