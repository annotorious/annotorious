<script lang="ts">
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import { boundsFromPoints } from '../../../model';
  import type { Bounds, Polygon, PolygonGeometry, Shape } from '../../../model';
  import type { Transform } from '../../Transform';
  import { Editor } from '..';
  import Handle from './BetterPolygonHandle.svelte';
  import Midpoint from './BetterPolygonMidpoint.svelte';

  const dispatch = createEventDispatcher<{ change: Polygon }>();

  /** Time difference (milliseconds) required for registering a click/tap **/
  const CLICK_THRESHOLD = 250;

  /** Minimum distance (px) to shape required for midpoints to show */
  const MIN_HOVER_DISTANCE = 1000;

  /** Minimum distance (px) between corners required for midpoints to show **/
  const MIN_CORNER_DISTANCE = 12;

  /** Needed for the <mask> element **/
  const MIDPOINT_SIZE = 4.5;

  /** Props */
  export let shape: Polygon;
  export let computedStyle: string | undefined;
  export let transform: Transform;
  export let viewportScale: number = 1;
  export let svgEl: SVGSVGElement;

  /** Drawing tool layer **/
  let polygonEl: SVGGElement;
  let visibleMidpoint: number | undefined;
  let isHandleHovered = false;
  let lastHandleClick: number | undefined;
  let selectedCorners: number[] = [];

  $: geom = shape.geometry;

  $: midpoints = geom.points.map((thisCorner, idx) => {
    const nextCorner = idx === geom.points.length - 1 ? geom.points[0] : geom.points[idx + 1];
    
    const x = (thisCorner[0] + nextCorner[0]) / 2;
    const y = (thisCorner[1] + nextCorner[1]) / 2;

    const dist = Math.sqrt( 
      Math.pow(nextCorner[0] - x, 2) + Math.pow(nextCorner[1] - y, 2));

    // Don't show if the distance between the corners is too small
    const visible = dist > MIN_CORNER_DISTANCE / viewportScale;

    return { point: [x, y], visible };
  });

  /** Handle hover state **/
  const onEnterHandle = () => isHandleHovered = true;
  const onLeaveHandle = () => isHandleHovered = false;

  /** Determine visible midpoint, if any **/
  const onPointerMove = (evt: PointerEvent) => {
    const [px, py] = transform.elementToImage(evt.offsetX, evt.offsetY);

    const getDistSq = (pt: number[]) =>
      Math.pow(pt[0] - px, 2) + Math.pow(pt[1] - py, 2);

    const closestCorner = geom.points.reduce((closest, corner) =>
      getDistSq(corner) < getDistSq(closest) ? corner : closest);

    const closestVisibleMidpoint = midpoints
      .filter(m => m.visible)
      .reduce((closest, midpoint) =>
        getDistSq(midpoint.point) < getDistSq(closest.point) ? midpoint : closest);

    // Show midpoint of the mouse is at least within THRESHOLD distance
    // of the midpoint or the closest corner. (Basically a poor man's shape buffering).
    const threshold = Math.pow(MIN_HOVER_DISTANCE / viewportScale, 2);

    const shouldShow = 
      getDistSq(closestCorner) < threshold ||
      getDistSq(closestVisibleMidpoint.point) < threshold;

    if (shouldShow)
      visibleMidpoint = midpoints.indexOf(closestVisibleMidpoint);
    else
      visibleMidpoint = undefined;
  }

  /** 
   * SVG element keeps loosing focus when interacting with 
   * shapes–this function refocuses.
   */
  const reclaimFocus = () => {
    if (document.activeElement !== svgEl)
      svgEl.focus();
  }

  /**
   * De-selects all corners and reclaims focus.
   */
  const onShapePointerUp = () => {
    selectedCorners = [];
    reclaimFocus();
  }

  /**
   * Updates state, waiting for potential click.
   */
  const onHandlePointerDown = (evt: PointerEvent) => {
    isHandleHovered = true;

    evt.preventDefault();
    evt.stopPropagation();

    lastHandleClick = performance.now();
  }

  /** Selection handling logic **/
  const onHandlePointerUp = (idx: number) => (evt: PointerEvent) => {
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
      if (isSelected && selectedCorners.length > 1)
        // Keep selected, de-select others
        selectedCorners = [idx]
      else if (isSelected)
        // De-select
        selectedCorners = [];
      else
        selectedCorners = [idx];
    }

    reclaimFocus();
  }

  const editor = (polygon: Shape, handle: string, delta: [number, number]) => {
    reclaimFocus();
    
    let points: [number, number][];

    const geom = (polygon.geometry) as PolygonGeometry;

    if (selectedCorners.length > 1) {
      points = geom.points.map(([x, y], idx) =>
          selectedCorners.includes(idx) ? [x + delta[0], y + delta[1]] : [x, y]);
    } else if (handle === 'SHAPE') {
      points = geom.points.map(([x, y]) => [x + delta[0], y + delta[1]]);
    } else {
      points = geom.points.map(([x, y], idx) =>
        handle === `HANDLE-${idx}` ? [x + delta[0], y + delta[1]] : [x, y]);
    }

    const bounds = boundsFromPoints(points);
    return {
      ...polygon,
      geometry: { points, bounds }
    }
  }

  const onAddPoint = (midpointIdx: number) => async (evt: PointerEvent) => {
    evt.stopPropagation();

    const points = [
      ...geom.points.slice(0, midpointIdx + 1),
      midpoints[midpointIdx].point,
      ...geom.points.slice(midpointIdx + 1)
    ] as [number, number][];

    const bounds = boundsFromPoints(points);

    dispatch('change', {
      ...shape,
      geometry: { points, bounds }
    });

    await tick();

    // Find the newly inserted handle and dispatch grab event
    const newHandle = [...document.querySelectorAll(`.a9s-better-handle`)][midpointIdx + 1];
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

  const onDeleteSelected = () => {
    // Polygon needs 3 points min
    if (geom.points.length < 4) return;

    const points = geom.points.filter((_, i) => !selectedCorners.includes(i)) as [number, number][];
    const bounds = boundsFromPoints(points);

    dispatch('change', {
      ...shape,
      geometry: { points, bounds }
    });

    selectedCorners = [];
  }

  onMount(() => {
    const onKeydown = (evt: KeyboardEvent) => {
      if (evt.key === 'Delete' || evt.key === 'Backspace') {
        evt.preventDefault();
        onDeleteSelected();
      }
    };

    svgEl.addEventListener('pointermove', () => {
      console.log('move!');
    })

    svgEl.addEventListener('pointermove', onPointerMove);
    svgEl.addEventListener('keydown', onKeydown);

    return () => {
      svgEl.removeEventListener('pointermove', onPointerMove);
      svgEl.removeEventListener('keydown', onKeydown);
    }
  });

  $: mask = (() => {
    const buffer = MIDPOINT_SIZE / viewportScale;

    const { minX, minY, maxX, maxY } = geom.bounds;

    return {
      x: minX - buffer,
      y: minY - buffer,
      w: maxX - minX + 2 * buffer,
      h: maxY - minY + 2 * buffer
    }
  })();
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
  
  <defs>
    <mask id="outer-mask" class="a9s-polygon-editor-mask">
      <rect x={mask.x} y={mask.y} width={mask.w} height={mask.h} />
      <polygon points={geom.points.map(xy => xy.join(',')).join(' ')} />   
      
      {#if (visibleMidpoint !== undefined && !isHandleHovered)}
        {@const { point } = midpoints[visibleMidpoint]}
        <circle cx={point[0]} cy={point[1]} r={MIDPOINT_SIZE / viewportScale} />
      {/if}  
    </mask>

    {#if (visibleMidpoint !== undefined && !isHandleHovered)}
      {@const { point } = midpoints[visibleMidpoint]}
      <mask id="inner-mask" class="a9s-polygon-editor-mask">
        <rect x={mask.x} y={mask.y} width={mask.w} height={mask.h} /> 
        <circle cx={point[0]} cy={point[1]} r={MIDPOINT_SIZE / viewportScale} />
      </mask>
    {/if}
  </defs>

  <polygon
    class="a9s-outer"
    mask="url(#outer-mask)"
    on:pointerup={onShapePointerUp}
    on:pointerdown={grab('SHAPE')}
    points={geom.points.map(xy => xy.join(',')).join(' ')} />

  <polygon
    bind:this={polygonEl}
    class="a9s-inner a9s-shape-handle"
    mask="url(#inner-mask)"
    style={computedStyle}
    on:pointermove={onPointerMove}
    on:pointerup={onShapePointerUp}
    on:pointerdown={grab('SHAPE')}
    points={geom.points.map(xy => xy.join(',')).join(' ')} />

  {#each geom.points as point, idx}
    <Handle 
      x={point[0]}
      y={point[1]}
      scale={viewportScale}
      selected={selectedCorners.includes(idx)}
      on:pointerenter={onEnterHandle}
      on:pointerleave={onLeaveHandle}
      on:pointerdown={onHandlePointerDown}
      on:pointerdown={grab(`HANDLE-${idx}`)}
      on:pointerup={onHandlePointerUp(idx)} />
  {/each}

  {#if (visibleMidpoint !== undefined && !isHandleHovered)}
    {@const { point } = midpoints[visibleMidpoint]}
    <Midpoint 
      x={point[0]}
      y={point[1]}
      scale={viewportScale}
      on:pointerdown={onAddPoint(visibleMidpoint)} />
  {/if}
</Editor>

<style>
  mask.a9s-polygon-editor-mask > rect {
    fill: #fff;
  }

  mask.a9s-polygon-editor-mask > circle,
  mask.a9s-polygon-editor-mask > polygon {
    fill: #000;
  }
</style>