<script lang="ts">
  import { createEventDispatcher, onMount, type SvelteComponent } from 'svelte';
  import type { Transform } from '../Transform';
  import type { Shape } from 'src/model';

  const dispatch = createEventDispatcher<{ startDrawing: PointerEvent, create: Shape }>();

  /** Props **/
  export let drawOnSingleClick: boolean;
  export let target: SVGGElement;
  export let tool: typeof SvelteComponent;
  export let transform: Transform;
  export let viewportScale: number;

  let toolComponent: SvelteComponent;

  $: if (toolComponent) toolComponent.$set({ transform });

  $: if (toolComponent) toolComponent.$set({ viewportScale });

  onMount(() => {
    toolComponent = new tool({
      target,
      props: { transform, viewportScale, drawOnSingleClick }
    });

    toolComponent.$on('startDrawing',
      event => dispatch('startDrawing', event.detail));

    toolComponent.$on('create', 
      event => dispatch('create', event.detail));

    return () => {
      toolComponent.$destroy();
    }
  });
</script>