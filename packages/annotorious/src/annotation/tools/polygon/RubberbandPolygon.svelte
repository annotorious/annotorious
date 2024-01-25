<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import type { DrawingMode } from '../../../AnnotoriousOpts';
  import { boundsFromPoints, computeArea, ShapeType, type Polygon } from '../../../model';
  import { distance } from '../../utils';
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
  let touchPauseTimer: number | undefined;

  let isClosable: boolean = false;

  const CLOSE_DISTANCE = 20;

  const TOUCH_PAUSE_LIMIT = 1500;

  $: handleSize = 10 / viewportScale;

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

    // Require min 3 points (incl. cursor) and minimum
    // polygon area
    const p = [...points, cursor];

    const shape: Polygon = {
      type: ShapeType.POLYGON, 
      geometry: {
        bounds: boundsFromPoints(p),
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
</script>

<g class="a9s-annotation a9s-rubberband">
  {#if cursor}
    {@const coords = (isClosable ? points : [...points, cursor]).map(xy => xy.join(',')).join(' ')}
      <polygon 
        class="a9s-outer"
        points={coords} />

      <polygon 
        class="a9s-inner"
        points={coords} />
        
    {#if isClosable}
      <rect 
        class="a9s-corner-handle"
        x={points[0][0] - handleSize / 2} 
        y={points[0][1] - handleSize / 2} 
        height={handleSize} 
        width={handleSize} />
    {/if}
  {/if}
</g>