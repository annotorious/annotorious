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

  let isHandleGrabbed = false;
  let lastHandleClick: number | undefined;
  let selectedCorners: number[] = [];

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

    isHandleGrabbed = true;

    lastHandleClick = performance.now();
  }

  const onHandlePointerUp = (idx: number) => (evt: PointerEvent) => {
    isHandleGrabbed = false;

    if (!lastHandleClick) return;

    // Drag, not click
    if (performance.now() - lastHandleClick > CLICK_THRESHOLD) return;

    const isSelected = selectedCorners.includes(idx);

    if (evt.metaKey || evt.ctrlKey || evt.shiftKey) {
      // Add to or remove from selection
      if (isSelected)
        selectedCorners = selectedCorners.filter(i => i !== idx);
      else
        selectedCorners = [...selectedCorners, idx];
    } else {
      // Reset selection
      if (isSelected && selectedCorners.length > 1)
        // Keep selected, de-select others
        selectedCorners = [idx]
      else if (isSelected)
        // De-select
        selectedCorners = [];
      else
        selectedCorners = [idx];
    }
  }

  const onPointerMove = (evt: PointerEvent) => {
    const [px, py] = transform.elementToImage(evt.offsetX, evt.offsetY);

    const getDistSq = (pt: number[]) =>
      Math.pow(pt[0] - px, 2) + Math.pow(pt[1] - py, 2);

    // The midpoint closest to the mouse pointer
    const closestMidpointIdx = midpoints.reduce<number>((closestIdx, midpoint, currentIdx) =>
      getDistSq(midpoint) < getDistSq(midpoints[closestIdx]) ? currentIdx : closestIdx
    , 0);

    visibleMidpoints = [closestMidpointIdx];
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
    evt.stopPropagation();

    const points = [
      ...geom.points.slice(0, midpointIdx + 1),
      midpoints[midpointIdx],
      ...geom.points.slice(midpointIdx + 1)
    ] as [number, number][];

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

  const onDeleteSelectedCorners = () => {
    // Polygon needs 3 points min
    if (geom.points.length < 4) return;

    const points = geom.points.filter((_, i) => !selectedCorners.includes(i)) as [number, number][];
    const bounds = boundsFromPoints(points);

    dispatch('change', {
      ...shape,
      geometry: { points, bounds }
    });
  }

  const onKeydown = (evt: KeyboardEvent) => {
    if (evt.key === 'Delete' || evt.key === 'Backspace') {
      evt.preventDefault();
      onDeleteSelectedCorners();
    }
  };

  onMount(() => {
    svgEl.addEventListener('pointermove', onPointerMove);
    svgEl.addEventListener('keydown', onKeydown);

    return () => {
      svgEl.removeEventListener('pointermove', onPointerMove);
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
 
  <mask id="ghost-handle-mask-{shape.type}">
    <!-- White allows content to show through -->
    <rect class="mask" width="100%" height="100%" fill="white"/>
    <!-- Black circles hide the polygon lines under ghost handles -->
    {#if (visibleMidpoints.length > 0 && !isHandleGrabbed)}
      {#each midpoints as pt, idx}
        {#if (visibleMidpoints.includes(idx))}
          <circle cx={pt[0]} cy={pt[1]} r={handleSize - 1.5} fill="black"/>
        {/if}
      {/each}
    {/if}
  </mask>


  <!-- polygon
    class="a9s-outer"
    style={computedStyle ? 'display:none;' : undefined}
    mask="url(#ghost-handle-mask-{shape.type})"
    on:pointerdown={grab('SHAPE')}
    points={geom.points.map(xy => xy.join(',')).join(' ')} / -->

  <polygon
    class="a9s-inner a9s-shape-handle"
    style={computedStyle}
    mask="url(#ghost-handle-mask-{shape.type})"
    on:pointermove={onPointerMove}
    on:pointerdown={grab('SHAPE')}
    points={geom.points.map(xy => xy.join(',')).join(' ')} />

  {#each geom.points as point, idx}
    <g class="a9s-better-handle-wrapper">
      <circle 
        class={`a9s-better-handle a9s-better-handle-outer${selectedCorners.includes(idx) ? ' selected' : ''}`}
        cx={point[0]} 
        cy={point[1]} 
        r={handleSize}
        on:pointerdown={onHandlePointerDown(idx)}
        on:pointerdown={grab(`HANDLE-${idx}`)}
        on:pointerup={onHandlePointerUp(idx)} />

      <circle 
        class={`a9s-better-handle a9s-better-handle-inner${selectedCorners.includes(idx) ? ' selected' : ''}`}
        cx={point[0]} 
        cy={point[1]} 
        r={handleSize - 2}
        on:pointerdown={onHandlePointerDown(idx)}
        on:pointerdown={grab(`HANDLE-${idx}`)}
        on:pointerup={onHandlePointerUp(idx)} />
    </g>
  {/each}

  {#if (visibleMidpoints.length > 0 && !isHandleGrabbed)}
    <g>
      {#each midpoints as pt, idx}
        {#if (visibleMidpoints.includes(idx))}
          <circle 
            class="a9s-midpoint"
            cx={pt[0]}
            cy={pt[1]}
            r={handleSize - 1.5} 
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
    fill: rgba(255, 255, 255, 0.65);
    stroke: #757575;
    stroke-width: 0.25px;  
    transition: fill 400ms;
  }

  .a9s-midpoint:hover {
    fill: #fff;
  }

  mask > rect {
    fill: #fff;
  }
</style>