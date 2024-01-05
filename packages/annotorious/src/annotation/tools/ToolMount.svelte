<script lang="ts">
  import { createEventDispatcher, onMount, type SvelteComponent } from 'svelte';
  import type { Transform } from '../Transform';
  import type { Shape } from 'src/model';
  import type { DrawingMode } from 'src/AnnotoriousOpts';

  const dispatch = createEventDispatcher<{ create: Shape }>();

  /** Props **/
  export let drawingMode: DrawingMode;
  export let target: SVGGElement;
  export let tool: typeof SvelteComponent;
  export let transform: Transform;
  export let viewportScale: number;

  let toolComponent: SvelteComponent;

  $: if (toolComponent) toolComponent.$set({ transform });
  $: if (toolComponent) toolComponent.$set({ viewportScale });

  onMount(() => {
    const svg = target.closest('svg');

    const cleanup: Function[] = [];

    const addEventListener = (name: keyof SVGSVGElementEventMap, handler: EventListenerOrEventListenerObject, capture?: boolean) => {
      svg?.addEventListener(name, handler, capture);
      cleanup.push(() => svg?.removeEventListener(name, handler, capture));
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