<script type="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import type { DrawingMode } from '../../../AnnotoriousOpts';
  import { boundsFromPoints, ShapeType, type Polygon } from '../../../model';
  import { distance } from '../../utils';
  import type { Transform } from '../..';

  const dispatch = createEventDispatcher<{ create: Polygon }>();

  /** Props **/
  export let addEventListener: (type: string, fn: EventListener, capture?: boolean) => void;
  export let drawingMode: DrawingMode;
  export let transform: Transform;
  export let viewportScale = 1;

  let container: SVGGElement;

  let lastPointerDown: number;

  let points: [number, number][] = [];
  
  let cursor: [number, number] = null;

  let isClosable: boolean = false;

  const CLOSE_DISTANCE = 20;

  $: handleSize = 10 / viewportScale;

  const onPointerDown = (evt: PointerEvent) => {
    lastPointerDown = performance.now();

    if (drawingMode === 'drag') {
      if (points.length === 0) {
        const point = transform.elementToImage(evt.offsetX, evt.offsetY);
        points.push(point);

        cursor = point;
      }
    }
  }

  const onPointerMove = (evt: PointerEvent) => {
    if (points.length > 0) {
      cursor = transform.elementToImage(evt.offsetX, evt.offsetY);

      if (points.length >  2) {
        const d = distance(cursor, points[0]) * viewportScale;
        isClosable = d < CLOSE_DISTANCE;
      }
    }
  }

  const onPointerUp = (evt: PointerEvent) => {
    const timeDifference = performance.now() - lastPointerDown;

    if (drawingMode === 'click') {
      // Not a single click - ignore
      if (timeDifference > 300)
        return;

      evt.stopPropagation();

      if (isClosable) {
        stopDrawing();
      } else if (points.length === 0) {
        // Start drawing
        const point = transform.elementToImage(evt.offsetX, evt.offsetY);
        points.push(point);

        cursor = point;
      } else {
        points.push(cursor);
      }
    } else {
      // Require minimum drag of 4px
      if (points.length === 1) {
        const dist = distance(points[0], cursor);

        if (dist <= 4) {
          // Cancel
          points = [];
          cursor = null;

          return;
        }
      }

      // Stop click event from propagating if we're drawing
      evt.stopImmediatePropagation();

      if (isClosable) {
        stopDrawing();
      } else {
        points.push(cursor);
      }
    }
  }

  const onDblClick = () => {
    console.log('dblclick');
    
    const p = [...points, cursor];

    const shape: Polygon = {
        type: ShapeType.POLYGON, 
        geometry: {
          bounds: boundsFromPoints(p),
          points: p
        }
      }

      points = [];
      cursor = null;
    
      dispatch('create', shape);
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
    cursor = null;
  
    dispatch('create', shape);
  }

  onMount(() => {
    addEventListener('pointerdown', onPointerDown, true);
    addEventListener('pointermove', onPointerMove);
    addEventListener('pointerup', onPointerUp, true);
    addEventListener('dblclick', onDblClick, true);
  });
</script>

<g 
  bind:this={container}
  class="a9s-annotation a9s-rubberband">

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