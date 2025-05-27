<script lang="ts">
  import type { 
    MultiPolygon, 
    MultiPolygonElement, 
    MultiPolygonGeometry, 
    Shape 
  } from '../../../model';
  import { 
    boundsFromMultiPolygonElements, 
    boundsFromPoints, 
    multipolygonElementToPath 
  } from '../../../model';
  import type { Transform } from '../../Transform';
  import { getMaskDimensions } from '../../utils';
  import { Editor, Handle } from '..';

  /** Props */
  export let shape: MultiPolygon;
  export let computedStyle: string | undefined;
  export let transform: Transform;
  export let viewportScale: number = 1;
  export let svgEl: SVGSVGElement;

  $: geom = shape.geometry;

  const editor = (shape: Shape, handle: string, delta: [number, number]) => {
    const elements = ((shape.geometry) as MultiPolygonGeometry).polygons;

    let updated: MultiPolygonElement[];

    if (handle === 'SHAPE') {
      updated = elements.map(element => {
        const rings = element.rings.map((ring, r) => {
          const points = ring.points.map((point, p) => {
            return [point[0] + delta[0], point[1] + delta[1]];
          });

          return { points };
        });

        const bounds = boundsFromPoints(rings[0].points as [number, number][]);
        return { rings, bounds } as MultiPolygonElement;
      });
    } else {
      const [_, elementIdx, ringIdx, pointIdx] = handle.split('-').map(str => parseInt(str));

      updated = elements.map((element, e) => {
        if (e === elementIdx) {
          const rings = element.rings.map((ring, r) => {
            if (r === ringIdx) {
              const points = ring.points.map((point, p) => {
                if (p === pointIdx) {
                  return [point[0] + delta[0], point[1] + delta[1]];
                } else {
                  return point;
                }
              });

              return { points };
            } else {
              return ring;
            }
          });

          const bounds = boundsFromPoints(rings[0].points as [number, number][]);
          return { rings, bounds } as MultiPolygonElement;
        } else {
          return element;
        }
      });
    }

    return { 
      ...shape, 
      geometry: {
        polygons: updated,
        bounds: boundsFromMultiPolygonElements(updated)
      } 
    } as MultiPolygon;
  }

  $: mask = getMaskDimensions(geom.bounds, 2 / viewportScale);

  const maskId = `multipoly-mask-${Math.random().toString(36).substring(2, 12)}`;
</script>

<Editor
  shape={shape}
  transform={transform}
  editor={editor}
  svgEl={svgEl}
  on:change 
  on:grab
  on:release
  let:grab={grab}>
  {#each geom.polygons as element, elementIdx}
    <g>
      <defs>
        <mask id={`${maskId}-${elementIdx}`} class="a9s-multipolygon-editor-mask">
          <rect x={mask.x} y={mask.y} width={mask.w} height={mask.h} />
          <path d={multipolygonElementToPath(element)} />   
        </mask>
      </defs>

      <path 
        class="a9s-outer"
        mask={`url(#${maskId}-${elementIdx})`}
        fill-rule="evenodd"
        on:pointerdown={grab('SHAPE')}
        d={multipolygonElementToPath(element)} />

      <path 
        class="a9s-inner"
        style={computedStyle}
        fill-rule="evenodd"
        on:pointerdown={grab('SHAPE')}
        d={multipolygonElementToPath(element)} />

      {#each element.rings as ring, ringIdx}
        {#each ring.points as point, pointIdx}
          <Handle 
            class="a9s-corner-handle"
            on:pointerdown={grab(`HANDLE-${elementIdx}-${ringIdx}-${pointIdx}`)}
            x={point[0]} y={point[1]} 
            scale={viewportScale} />
        {/each}
      {/each}
    </g>
  {/each}
</Editor>

<style>
  mask.a9s-multipolygon-editor-mask > rect {
    fill: #fff;
  }

  mask.a9s-multipolygon-editor-mask > path {
    fill: #000;
  }
</style>