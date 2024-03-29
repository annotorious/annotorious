<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { DrawingMode } from '../../../AnnotoriousOpts';
  import { ShapeType, type Rectangle } from '../../../model';
  import type { Transform } from '../..';

  const dispatch = createEventDispatcher<{ create: Rectangle }>();
  
  /** Props **/
  export let addEventListener: (type: string, fn: EventListener, capture?: boolean) => void;
  export let drawingMode: DrawingMode;
  export let transform: Transform;

  let lastPointerDown: number;

  let origin: [x: number, y: number] | undefined; 

  let anchor: [number, number] | undefined;

  let x: number, y: number, w: number, h: number;

  const onPointerDown = (event: Event) => {
    const evt = event as PointerEvent;

    lastPointerDown = performance.now();

    if (drawingMode === 'drag') {
      origin = transform.elementToImage(evt.offsetX, evt.offsetY);
      anchor = origin;

      x = origin[0];
      y = origin[1];
      w = 1;
      h = 1;
    }
  }

  const onPointerMove = (event: Event) => {
    const evt = event as PointerEvent;

    if (origin) {
      anchor = transform.elementToImage(evt.offsetX, evt.offsetY);

      x = Math.min(anchor[0], origin[0]);
      y = Math.min(anchor[1], origin[1]);
      w = Math.abs(anchor[0] - origin[0]);
      h = Math.abs(anchor[1] - origin[1]);
    }
  }
    
  const onPointerUp = (event: Event) => {
    const evt = event as PointerEvent;

    const timeDifference = performance.now() - lastPointerDown;

    if (drawingMode === 'click') {
      // Not a single click - ignore
      if (timeDifference > 300)
        return;

      evt.stopPropagation();

      if (origin) {
        stopDrawing();
      } else {
        // Start drawing
        origin = transform.elementToImage(evt.offsetX, evt.offsetY);
        anchor = origin;

        x = origin[0];
        y = origin[1];
        w = 1;
        h = 1;
      }
    } else if (origin) {
      if (timeDifference > 300 || w * h > 100) {
        evt.stopPropagation();
        stopDrawing();
      } else {
        origin = undefined;
        anchor = undefined;
      }
    }
  }

  const stopDrawing = () => {
    // Require 4x4 pixels minimum
    if (w * h > 15) {
      const shape: Rectangle = {
        type: ShapeType.RECTANGLE, 
        geometry: {
          bounds: {
            minX: x, 
            minY: y,
            maxX: x + w,
            maxY: y + h
          },
          x, y, w, h
        }
      }

      dispatch('create', shape);
    }
    
    origin = undefined;
    anchor = undefined;
  }

  onMount(() => {
    addEventListener('pointerdown', onPointerDown);
    addEventListener('pointermove', onPointerMove);
    addEventListener('pointerup', onPointerUp, true);
  });
</script>

<g class="a9s-annotation a9s-rubberband">
  {#if origin}
    <rect
      class="a9s-outer"
      x={x} 
      y={y} 
      width={w} 
      height={h} />

    <rect
      class="a9s-inner"
      x={x} 
      y={y} 
      width={w} 
      height={h} />
  {/if}
</g>