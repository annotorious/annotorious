<script lang="ts">
  import { createEventDispatcher, onMount, type SvelteComponent } from 'svelte';
  import type OpenSeadragon from 'openseadragon';
  import type { DrawingMode, Shape, Transform } from '@annotorious/annotorious/src';

  const dispatch = createEventDispatcher<{ create: Shape }>();

  /** Props **/
  export let drawingMode: DrawingMode;
  export let target: SVGGElement;
  export let tool: typeof SvelteComponent;
  export let transform: Transform;
  export let viewer: OpenSeadragon.Viewer
  export let viewportScale: number;

  let toolComponent: SvelteComponent;

  $: if (toolComponent) toolComponent.$set({ transform });
  $: if (toolComponent) toolComponent.$set({ viewportScale });

  onMount(() => {
    const svg = target.closest('svg');

    const cleanup: Function[] = [];

    const addEventListener = (name: string, handler: (evt: PointerEvent) => void, capture?: boolean) => {
      if (name === 'pointerup' || name === 'dblclick') {
        // OpenSeadragon, by design, stops the 'pointerup' event. In order to capture pointer up events,
        // we need to listen to the canvas-click event instead
        const osdHandler = (event: OpenSeadragon.CanvasClickEvent) => {
          const { originalEvent } = event;
          handler(originalEvent as PointerEvent);
        }

        const osdName = name === 'pointerup' ? 'canvas-click' : 'canvas-double-click';

        viewer.addHandler(osdName, osdHandler);
        cleanup.push(() => viewer.removeHandler(osdName, osdHandler));
      } else {
        svg.addEventListener(name, handler, capture);
        cleanup.push(() => svg.removeEventListener(name, handler, capture));
      }
    }

    toolComponent = new tool({
      target,
      props: { 
        addEventListener,
        drawingMode,
        transform, 
        viewportScale
      }
    });

    toolComponent.$on('create', 
      event => dispatch('create', event.detail));

    return () => {
      cleanup.forEach(fn => fn());
      toolComponent.$destroy();
    }
  });
</script>