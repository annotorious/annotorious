<script lang="ts">
  import { createEventDispatcher, onMount, type SvelteComponent } from 'svelte';
  import type { Transform } from '../Transform';
  import type { Shape } from 'src/model';

  const dispatch = createEventDispatcher<{ change: Shape }>();

  export let target: SVGGElement;

  export let editor: typeof SvelteComponent;

  export let shape: Shape;
  
  export let transform: Transform;

  export let viewportScale: number;

  let editorComponent: SvelteComponent;

  $: if (editorComponent) editorComponent.$set({ transform });

  $: if (editorComponent) editorComponent.$set({ viewportScale });

  onMount(() => {
    editorComponent = new editor({
      target,
      props: { shape, transform, viewportScale }
    });

    editorComponent.$on('change', event => {
      editorComponent.$$set({ shape: event.detail });
      dispatch('change', event.detail)
    });

    return () => {
      editorComponent.$destroy();
    }
  });
</script>