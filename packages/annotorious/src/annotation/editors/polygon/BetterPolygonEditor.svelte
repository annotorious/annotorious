<script lang="ts">
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import { boundsFromPoints } from '../../../model';
  import type { Polygon, PolygonGeometry, Shape } from '../../../model';
  import type { Transform } from '../../Transform';
  import { Editor } from '..';

  const dispatch = createEventDispatcher<{ change: Polygon }>();

  /** Props */
  export let shape: Polygon;
  export let computedStyle: string | undefined;
  export let transform: Transform;
  export let viewportScale: number = 1;
  export let svgEl: SVGSVGElement;

  $: geom = shape.geometry;
  $: handleSize = 6 / viewportScale;

  const CLICK_THRESHOLD = 250;

  let lastHandleClick: number | undefined;

  let selectedCorner: number | undefined;

  $: midpoints = geom.points.map((thisCorner, idx) => {
    const nextCorner = idx === geom.points.length - 1 ? geom.points[0] : geom.points[idx + 1];
    
    const x = (thisCorner[0] + nextCorner[0]) / 2;
    const y = (thisCorner[1] + nextCorner[1]) / 2;

    return [x, y];
  });

  let visibleMidpoints: number[] = []

  const onHandlePointerDown = (idx: number) => (evt: PointerEvent) => {
    evt.preventDefault();
    evt.stopPropagation();

    lastHandleClick = performance.now();

    if (selectedCorner !== undefined && selectedCorner !== idx)
      selectedCorner = undefined;
  }

  const onHandlePointerUp = (idx: number) => (evt: PointerEvent) => {
    if (!lastHandleClick) return;

    if ((performance.now() - lastHandleClick) < CLICK_THRESHOLD) {
      if (selectedCorner === idx) {
        visibleMidpoints = [];
        selectedCorner = undefined;
      } else {
        selectedCorner = idx;
      }
    }
  }

  const onPointerMove = (evt: PointerEvent) => {
    if (selectedCorner === undefined) return;

    const [px, py] = transform.elementToImage(evt.offsetX, evt.offsetY);

    const getDistSq = (pt: number[]) =>
      Math.pow(pt[0] - px, 2) + Math.pow(pt[1] - py, 2);

    // The midpoint closest to the mouse pointer
    const closestMidpointIdx = midpoints.reduce<number>((closestIdx, midpoint, currentIdx) =>
      getDistSq(midpoint) < getDistSq(midpoints[closestIdx]) ? currentIdx : closestIdx
    , 0);

    // Neighbours: the points before and after the closest midpoint
    const pointBeforeIdx = (closestMidpointIdx - 1 + midpoints.length) % midpoints.length;
    const pointAfterIdx = (closestMidpointIdx + 1) % midpoints.length;

    // Which neighbour is closer to the mouse pointer?
    const closestNeighbourIdx = getDistSq(geom.points[pointBeforeIdx]) > getDistSq(geom.points[pointAfterIdx])
      ? pointAfterIdx : pointBeforeIdx;

    // Show midpoints before and after the closest neighbour
    visibleMidpoints = [
      closestNeighbourIdx,
      closestNeighbourIdx === 0 ? midpoints.length - 1 : closestNeighbourIdx - 1
    ];
  }

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

  const addPoint = (midpointIdx: number) => async (evt: PointerEvent) => {
    const points = [
      ...geom.points.slice(0, midpointIdx + 1),
      midpoints[midpointIdx],
      ...geom.points.slice(midpointIdx + 1)
    ] as [number, number][];

    selectedCorner = midpointIdx + 1;

    const bounds = boundsFromPoints(points);

    dispatch('change', {
      ...shape,
      geometry: { points, bounds }
    });

    await tick();

    // Find the newly inserted handle and dispatch grab event
    const newHandle = [...document.querySelectorAll(`.a9s-better-handle-wrapper`)][midpointIdx + 1];
    if (newHandle?.firstChild) {
      const newEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        clientX: evt.clientX,
        clientY: evt.clientY,
        pointerId: evt.pointerId,
        pointerType: evt.pointerType,
        isPrimary: evt.isPrimary,
        buttons: evt.buttons
      });

      newHandle.firstChild.dispatchEvent(newEvent);
    }
  }

  const onDeleteSelectedCorner = () => {
    // Polygon needs 3 points min
    if (geom.points.length < 4) return;

    const points = geom.points.filter((_, i) => i !== selectedCorner) as [number, number][];
    const bounds = boundsFromPoints(points);

    dispatch('change', {
      ...shape,
      geometry: { points, bounds }
    });
  }

  onMount(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        onDeleteSelectedCorner();
      }
    };

    svgEl.addEventListener('keydown', onKeydown);

    return () => {
      svgEl.removeEventListener('keydown', onKeydown);
    }
  });
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

  <polygon
    class="a9s-outer"
    style={computedStyle ? 'display:none;' : undefined}
    on:pointerdown={grab('SHAPE')}
    points={geom.points.map(xy => xy.join(',')).join(' ')} />

  <polygon
    class="a9s-inner a9s-shape-handle"
    style={computedStyle}
    on:pointermove={onPointerMove}
    on:pointerdown={grab('SHAPE')}
    points={geom.points.map(xy => xy.join(',')).join(' ')} />

  {#each geom.points as point, idx}
    <g class="a9s-better-handle-wrapper">
      <circle 
        class={`a9s-better-handle a9s-better-handle-outer${selectedCorner === idx ? ' selected' : ''}`}
        cx={point[0]} 
        cy={point[1]} 
        r={handleSize}
        on:pointerdown={onHandlePointerDown(idx)}
        on:pointerdown={grab(`HANDLE-${idx}`)}
        on:pointerup={onHandlePointerUp(idx)} />

      <circle 
        class={`a9s-better-handle a9s-better-handle-inner${selectedCorner === idx ? ' selected' : ''}`}
        cx={point[0]} 
        cy={point[1]} 
        r={handleSize - 2}
        on:pointerdown={onHandlePointerDown(idx)}
        on:pointerdown={grab(`HANDLE-${idx}`)}
        on:pointerup={onHandlePointerUp(idx)} />
    </g>
  {/each}

  {#if selectedCorner !== undefined}
    <g>
      {#each midpoints as pt, idx}
        {#if (visibleMidpoints.includes(idx))}
          <circle 
            class="a9s-midpoint"
            cx={pt[0]}
            cy={pt[1]}
            r={handleSize - 2} 
            on:pointerdown={addPoint(idx)} />
        {/if}
      {/each}
    </g>
  {/if}
</Editor>

<style>
  .a9s-better-handle-outer {
    fill: #fff;
    stroke: #757575;
    stroke-width: 0.25px;  
  }

  .a9s-better-handle-inner {
    fill: #1a1a1a;
  }

  .a9s-better-handle-inner.selected {
    fill: #fff;
  }

  .a9s-midpoint {
    fill: red;
    stroke-width: 0;
  }
</style>