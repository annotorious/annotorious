<script lang="ts">
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import { dequal } from 'dequal/lite';
  import type { MultiPolygon, MultiPolygonElement, MultiPolygonGeometry, Shape } from '../../../model';
  import { getMaskDimensions, isTouch } from '../../utils';
  import type { Transform } from '../../Transform';
  import Editor from '../Editor.svelte';
  import Handle from '../Handle.svelte';
  import MidpointHandle from '../MidpointHandle.svelte';
  import { computeMidpoints } from './utils';
  import { 
    boundsFromMultiPolygonElements, 
    boundsFromPoints, 
    getAllCorners, 
    multipolygonElementToPath
  } from '../../../model';

  const dispatch = createEventDispatcher<{ change: MultiPolygon }>();

  /** Time difference (milliseconds) required for registering a click/tap **/
  const CLICK_THRESHOLD = 250;

  /** Minimum distance (px) to shape required for midpoints to show */
  const MIN_HOVER_DISTANCE = 1000;

  /** Needed for the <mask> element **/
  const MIDPOINT_SIZE = 4.5;

  /** Props */
  export let shape: MultiPolygon;
  export let computedStyle: string | undefined;
  export let transform: Transform;
  export let viewportScale: number = 1;
  export let svgEl: SVGSVGElement;

  /** Drawing tool layer **/
  let visibleMidpoint: number | undefined;
  let isHandleHovered = false;
  let lastHandleClick: number | undefined;
  let selectedCorners: { polygon: number, ring: number, point: number }[] = [];

  $: geom = shape.geometry;

  // No support yet for adding or removing points in mobile!
  $: midpoints = isTouch ? [] : computeMidpoints(geom, viewportScale);

  /** Handle hover state **/
  const onEnterHandle = () => isHandleHovered = true;
  const onLeaveHandle = () => isHandleHovered = false;

  /** Determine visible midpoint, if any **/
  const onPointerMove = (evt: PointerEvent) => {
    if (selectedCorners.length > 0 || !midpoints.some(m => m.visible)) {
      visibleMidpoint = undefined;
      return;
    }
    
    const [px, py] = transform.elementToImage(evt.offsetX, evt.offsetY);

    const getDistSq = (pt: number[]) =>
      Math.pow(pt[0] - px, 2) + Math.pow(pt[1] - py, 2);

    const closestCorner = getAllCorners(geom).reduce((closest, corner) =>
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
  const onHandlePointerUp = (polygon: number, ring: number, point: number) => (evt: PointerEvent) => {
    if (!lastHandleClick || isTouch) return;

    // Drag, not click
    if (performance.now() - lastHandleClick > CLICK_THRESHOLD) return;

    // Shorthand
    const isMatch = (other: { polygon: number, ring: number, point: number }) => 
      other.polygon === polygon && other.ring === ring && other.point === point;

    const isSelected = selectedCorners.some(isMatch);

    if (evt.metaKey || evt.ctrlKey || evt.shiftKey) {
      // Add to or remove from selection
      if (isSelected)
        selectedCorners = selectedCorners.filter(other => !isMatch(other));
      else
        selectedCorners = [...selectedCorners, { polygon, ring, point }];
    } else {
      if (isSelected && selectedCorners.length > 1)
        // Keep selected, de-select others
        selectedCorners = [{ polygon, ring, point }]
      else if (isSelected)
        // De-select
        selectedCorners = [];
      else
        selectedCorners = [{ polygon, ring, point }];
    }

    reclaimFocus();
  }

  const editor = (shape: Shape, handle: string, delta: [number, number]) => {
    reclaimFocus();
    
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

  const onAddPoint = (midpointIdx: number) => async (evt: PointerEvent) => {
    evt.stopPropagation();

    const midpoint = midpoints[midpointIdx];
    
    const updated = geom.polygons.map((element, elIdx) => {
      if (elIdx === midpoint.elementIdx) {
        const rings = element.rings.map((ring, ringIdx) => {
          if (ringIdx === midpoint.ringIdx) {
            const points = [
              ...ring.points.slice(0, midpoint.pointIdx + 1),
              midpoint.point,
              ...ring.points.slice(midpoint.pointIdx + 1)
            ] as [number, number][];

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

    dispatch('change', {
      ...shape, 
      geometry: {
        polygons: updated,
        bounds: boundsFromMultiPolygonElements(updated)
      } 
    } as MultiPolygon);

    await tick();

    // Find the newly inserted handle and dispatch grab event
    const newHandle = [...document.querySelectorAll(`.a9s-handle`)][midpointIdx + 1];
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
    const updatedPolygons = geom.polygons.map((polygon, polygonIdx) => {
      const hasSelected = selectedCorners.some(s => s.polygon === polygonIdx);

      if (hasSelected) {
        const updatedRings = polygon.rings.map((ring, ringIdx) => {
          const selectedCornersInRing = selectedCorners.filter(s => s.polygon === polygonIdx && s.ring === ringIdx);

          // Rings needs 3 points min
          if (selectedCornersInRing.length && ring.points.length - selectedCornersInRing.length >= 3) {
            const points = ring.points.filter((_, i) => !selectedCornersInRing.some(s => s.point === i));
            return { points };
          } else {
            // No points selected on this ring
            return ring;
          }
        });

        const bounds = boundsFromPoints(updatedRings[0].points as [number, number][]);
        return { rings: updatedRings, bounds } as MultiPolygonElement;
      } else {
        // No points selected on this polygon
        return polygon;
      }
    });

    const hasChanged = !dequal(geom.polygons, updatedPolygons);
    if (hasChanged) {
      dispatch('change', {
        ...shape, 
        geometry: {
          polygons: updatedPolygons,
          bounds: boundsFromMultiPolygonElements(updatedPolygons)
        } 
      } as MultiPolygon);

      selectedCorners = [];
    }
  }

  onMount(() => {
    if (isTouch) return;

    const onKeydown = (evt: KeyboardEvent) => {
      if (evt.key === 'Delete' || evt.key === 'Backspace') {
        evt.preventDefault();
        onDeleteSelected();
      }
    };

    svgEl.addEventListener('pointermove', onPointerMove);
    svgEl.addEventListener('keydown', onKeydown);

    return () => {
      svgEl.removeEventListener('pointermove', onPointerMove);
      svgEl.removeEventListener('keydown', onKeydown);
    }
  });

  $: mask = getMaskDimensions(geom.bounds, MIDPOINT_SIZE / viewportScale);

  const maskId = `polygon-mask-${Math.random().toString(36).substring(2, 12)}`;
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
        <mask id={`${maskId}-${elementIdx}-outer`} class="a9s-multipolygon-editor-mask">
          <rect x={mask.x} y={mask.y} width={mask.w} height={mask.h} />
          <path d={multipolygonElementToPath(element)} /> 
          
          {#if (visibleMidpoint !== undefined && !isHandleHovered)}
            {@const { point } = midpoints[visibleMidpoint]}
            <circle cx={point[0]} cy={point[1]} r={MIDPOINT_SIZE / viewportScale} />
          {/if}
        </mask>

        {#if (visibleMidpoint !== undefined && !isHandleHovered)}
          {@const { point } = midpoints[visibleMidpoint]}
          <mask id={`${maskId}-${elementIdx}-inner`}  class="a9s-multipolygon-editor-mask">
            <rect x={mask.x} y={mask.y} width={mask.w} height={mask.h} /> 
            <circle cx={point[0]} cy={point[1]} r={MIDPOINT_SIZE / viewportScale} />
          </mask>
        {/if}
      </defs>

      <path 
        class="a9s-outer"
        mask={`url(#${maskId}-${elementIdx}-outer)`}
        fill-rule="evenodd"
        on:pointerup={onShapePointerUp}
        on:pointerdown={grab('SHAPE')}
        d={multipolygonElementToPath(element)} />

      <path 
        class="a9s-inner"
        mask={`url(#${maskId}-${elementIdx}-inner)`}
        style={computedStyle}
        fill-rule="evenodd"
        on:pointerup={onShapePointerUp}
        on:pointerdown={grab('SHAPE')}
        d={multipolygonElementToPath(element)} />

      {#each element.rings as ring, ringIdx}
        {#each ring.points as point, pointIdx}
          <Handle 
            class="a9s-corner-handle"
            x={point[0]} 
            y={point[1]} 
            scale={viewportScale}
            selected={selectedCorners.some(({ polygon, ring, point }) => 
              polygon === elementIdx && ring === ringIdx && point === pointIdx)}
            on:pointerenter={onEnterHandle}
            on:pointerleave={onLeaveHandle}
            on:pointerdown={onHandlePointerDown}
            on:pointerdown={grab(`HANDLE-${elementIdx}-${ringIdx}-${pointIdx}`)}
            on:pointerup={onHandlePointerUp(elementIdx, ringIdx, pointIdx)}  />
        {/each}
      {/each}
    </g>
  {/each}

  {#if (visibleMidpoint !== undefined && !isHandleHovered)}
    {@const { point } = midpoints[visibleMidpoint]}
    <MidpointHandle 
      x={point[0]}
      y={point[1]}
      scale={viewportScale} 
      on:pointerdown={onAddPoint(visibleMidpoint)} />
  {/if}
</Editor>

<style>
  mask.a9s-multipolygon-editor-mask > rect {
    fill: #fff;
  }

  mask.a9s-multipolygon-editor-mask > circle,
  mask.a9s-multipolygon-editor-mask > path {
    fill: #000;
  }
</style>