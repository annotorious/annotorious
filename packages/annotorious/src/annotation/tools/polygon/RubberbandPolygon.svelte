<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import type { DrawingMode } from '../../../AnnotoriousOpts';
  import { boundsFromPoints, computeArea, distance, ShapeType, type Polygon } from '../../../model';
  import { getMaskDimensions } from '../../utils';
  import type { Transform } from '../..';

  const dispatch = createEventDispatcher<{ create: Polygon }>();

  /** Props **/
  export let addEventListener: (type: string, fn: EventListener, capture?: boolean) => void;
  export let drawingMode: DrawingMode;
  export let transform: Transform;
  export let viewportScale = 1;

  let lastPointerDown: { timeStamp: number, offsetX: number, offsetY: number };

  let points: [number, number][] = [];
  
  let cursor: [number, number] | undefined;

  // Keep track of the user keeping the finger
  // in place. Long pauses will be interpreted like a 
  // double click and close the shape.
  let touchPauseTimer: ReturnType<typeof setTimeout> | undefined;

  let isClosable: boolean = false;

  const CLOSE_DISTANCE = 20;

  const TOUCH_PAUSE_LIMIT = 1500;

  $: handleRadius = 4 / viewportScale;

  const onPointerDown = (event: Event) => {
    const evt = event as PointerEvent;

    // Note that the event itself is ephemeral!
    const { timeStamp, offsetX, offsetY } = evt;
    lastPointerDown = { timeStamp, offsetX, offsetY };

    if (drawingMode === 'drag') {
      if (points.length === 0) {
        const point = transform.elementToImage(evt.offsetX, evt.offsetY);
        points.push(point);

        cursor = point;
      }
    }
  }

  const onPointerMove = (event: Event) => {
    const evt = event as PointerEvent;

    if (touchPauseTimer) clearTimeout(touchPauseTimer);

    if (points.length > 0) {
      cursor = transform.elementToImage(evt.offsetX, evt.offsetY);

      if (points.length >  2) {
        const d = distance(cursor, points[0]) * viewportScale;
        isClosable = d < CLOSE_DISTANCE;
      }

      if (evt.pointerType === 'touch') {
        touchPauseTimer = setTimeout(() => {
          onDblClick();
        }, TOUCH_PAUSE_LIMIT);
      }
    }
  }

  const onPointerUp = (event: Event) => {
    // Edge case: if anno.setDrawingEnabled(true) is called
    // while the pointer is down, this handler may fire with
    // an undefined cursor. In this case: ignore.
    if (drawingMode === 'drag' && !cursor) return;

    const evt = event as PointerEvent;

    if (touchPauseTimer) clearTimeout(touchPauseTimer);

    if (drawingMode === 'click') {
      const timeDifference = evt.timeStamp - lastPointerDown.timeStamp;

      const d = distance(
        [lastPointerDown.offsetX, lastPointerDown.offsetY], 
        [evt.offsetX, evt.offsetY]);

      if (timeDifference > 300 || d > 15) // Not a single click - ignore
        return;

      if (isClosable) {
        stopDrawing();
      } else if (points.length === 0) {
        // Start drawing
        const point = transform.elementToImage(evt.offsetX, evt.offsetY);
        points.push(point);

        cursor = point;
      } else {
        points.push(cursor!);
      }
    } else {
      // Require minimum drag of 4px
      if (points.length === 1) {
        const dist = distance(points[0], cursor!);

        if (dist <= 4) {
          // Cancel
          points = [];
          cursor = undefined;

          return;
        }
      }

      // Stop click event from propagating if we're drawing
      evt.stopImmediatePropagation();

      if (isClosable) {
        stopDrawing();
      } else {
        points.push(cursor!);
      }
    }
  }

  const onDblClick = () => {    
    if (!cursor) return;

    // Require min 3 points and minimum polygon area.
    // Note that the double click will have added a duplicate point!
    const p = points.slice(0, -1);
    if (p.length < 3) return;

    const shape: Polygon = {
      type: ShapeType.POLYGON, 
      geometry: {
        bounds: boundsFromPoints(points),
        points: p
      }
    }

    const area = computeArea(shape);
    if (area > 4) {
      points = [];
      cursor = undefined;

      dispatch('create', shape);
    }
  }

  const stopDrawing = () => {
    const shape: Polygon = {
      type: ShapeType.POLYGON, 
      geometry: {
        bounds: boundsFromPoints(points),
        points: [...points]
      }
    }

    points = [];
    cursor = undefined;

    dispatch('create', shape);
  }

  onMount(() => {
    addEventListener('pointerdown', onPointerDown, true);
    addEventListener('pointermove', onPointerMove);
    addEventListener('pointerup', onPointerUp, true);
    addEventListener('dblclick', onDblClick, true);
  });

  $: coords = cursor ? (isClosable ? points : [...points, cursor]) : [];

  $: mask = coords.length > 0 ? getMaskDimensions(boundsFromPoints(coords), 2 / viewportScale) : undefined;

  const maskId = `polygon-mask-${Math.random().toString(36).substring(2, 12)}`;
</script>

<g class="a9s-annotation a9s-rubberband">
  {#if mask}
    {@const str = coords.map(xy => xy.join(',')).join(' ')}

    <defs>
      <mask id={maskId} class="a9s-rubberband-polygon-mask">
        <rect x={mask.x} y={mask.y} width={mask.w} height={mask.h} />
        <polygon points={str} />
      </mask>
    </defs>

    <polygon 
      class="a9s-outer"
      mask={`url(#${maskId})`}
      points={str} />

    <polygon 
      class="a9s-inner"
      points={str} />
        
    {#if isClosable}
      <circle 
        class="a9s-handle"
        cx={points[0][0]} 
        cy={points[0][1]} 
        r={handleRadius} />
    {/if}
  {/if}
</g>

<style>
  mask.a9s-rubberband-polygon-mask > rect {
    fill: #fff;
  }

  mask.a9s-rubberband-polygon-mask > polygon {
    fill: #000;
  }

  circle.a9s-handle {
    fill: #fff;
    pointer-events: none;
    stroke: rgba(0, 0, 0, 0.35);
    stroke-width: 1px;
    vector-effect: non-scaling-stroke;
  }
</style>