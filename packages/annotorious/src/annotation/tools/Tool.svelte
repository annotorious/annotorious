<script lang="ts">
  import { createEventDispatcher, onMount, type SvelteComponent } from 'svelte';
  import type { Transform } from '../Transform';
  import type { Shape } from 'src/model';

  const dispatch = createEventDispatcher<{ create: Shape }>();

  export let target: SVGGElement;

  export let tool: typeof SvelteComponent;
  
  export let transform: Transform;

  export let viewportScale: number;

  onMount(() => {
    const toolComponent = new tool({
      target,
      props: { transform, viewportScale }
    });

    toolComponent.$on('create', event => dispatch('create', event.detail));

    return () => {
      toolComponent.$destroy();
    }
  });
</script>