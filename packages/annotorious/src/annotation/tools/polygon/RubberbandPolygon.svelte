<script type="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { boundsFromPoints, ShapeType, type Polygon } from '../../../model';
  import { distance } from '../../utils';
  import type { Transform } from '../..';

  const dispatch = createEventDispatcher<{ create: Polygon }>();

  export let transform: Transform;

  export let viewportScale = 1;

  let container: SVGGElement;

  let points: [number, number][] = [];
  
  let cursor: [number, number] = null;

  let isClosable: boolean = false;

  const CLOSE_DISTANCE = 20;

  $: handleSize = 10 / viewportScale;

  const onPointerDown = (evt: PointerEvent) => {
    const point = transform.elementToImage(evt.offsetX, evt.offsetY);

    if (points.length === 0)
      points.push(point);

    cursor = point;
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
    } else {
      points.push(cursor);
    }
  }

  const onDblClick = () => {
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

  onMount(() => {
    const svg = container.closest('svg');

    svg.addEventListener('pointerdown', onPointerDown, true);
    svg.addEventListener('pointermove', onPointerMove);
    svg.addEventListener('pointerup', onPointerUp, true);
    svg.addEventListener('dblclick', onDblClick, true);

    return () => {
      svg.removeEventListener('pointerdown', onPointerDown, true);
      svg.removeEventListener('pointermove', onPointerMove, true);
      svg.removeEventListener('pointerup', onPointerUp, true);
      svg.removeEventListener('dblclick', onDblClick, true);
    }
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