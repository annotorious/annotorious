<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import type { DrawingMode } from '../../../AnnotoriousOpts';
  import {
    boundsFromPoint,
    computeArea,
    ShapeType,
    type Point,
    POINT_RADIUS,
  } from '../../../model';
  import { distance } from '../../utils';
  import type { Transform } from '../..';

  const dispatch = createEventDispatcher<{ create: Point }>();

  /** Props **/
  export let addEventListener: (
    type: string,
    fn: EventListener,
    capture?: boolean,
  ) => void;
  export let drawingMode: DrawingMode;
  export let transform: Transform;

  let point: [number, number] | undefined;

  const onPointerDown = (event: Event) => {
    const evt = event as PointerEvent;

    // Note that the event itself is ephemeral!
    const { timeStamp, offsetX, offsetY } = evt;

    if (drawingMode === 'drag') {
      const transformPoint = transform.elementToImage(evt.offsetX, evt.offsetY);
      point = transformPoint;
    }
  };

  const onPointerMove = (event: Event) => {
    const evt = event as PointerEvent;

    if ((point?.length ?? 0) > 0) {
      point = transform.elementToImage(evt.offsetX, evt.offsetY);
    }
  };

  const onPointerUp = (event: Event) => {
    const evt = event as PointerEvent;

    if (drawingMode === 'drag') {
      const transformPoint = transform.elementToImage(evt.offsetX, evt.offsetY);
      point = undefined;

      dispatch('create', {
        type: ShapeType.POINT,
        geometry: {
          x: transformPoint[0],
          y: transformPoint[1],
          bounds: boundsFromPoint(transformPoint[0], transformPoint[1]),
        },
      });
    }
  };

  onMount(() => {
    addEventListener('pointerdown', onPointerDown);
    addEventListener('pointermove', onPointerMove);
    addEventListener('pointerup', onPointerUp);
  });
</script>

<g class="a9s-annotationlayer a9s-rubberband-point">
  {#if point}
    <circle class="a9s-outer" cx={point[0]} cy={point[1]} r={POINT_RADIUS} />
    <circle class="a9s-inner" cx={point[0]} cy={point[1]} r={POINT_RADIUS} />
  {/if}
</g>
