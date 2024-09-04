<script lang="ts">
  import type { DrawingStyleExpression } from '@annotorious/core';
  import { createEventDispatcher, onMount, type SvelteComponent } from 'svelte';
  import type { ImageAnnotation, Shape } from '../../model';
  import { computeStyle } from '../utils/styling';
  import type { Transform } from '../Transform';

  const dispatch = createEventDispatcher<{ grab: PointerEvent, release: PointerEvent, change: Shape }>();

  /** Props */
  export let annotation: ImageAnnotation;
  export let editor: typeof SvelteComponent;
  export let style: DrawingStyleExpression<ImageAnnotation> | undefined;
  export let target: SVGGElement;
  export let transform: Transform;
  export let viewportScale: number;

  let editorComponent: SvelteComponent;

  $: computedStyle = computeStyle(annotation, style);

  $: if (annotation) editorComponent?.$set({ shape: annotation.target.selector });
  $: if (editorComponent) editorComponent.$set({ transform });
  $: if (editorComponent) editorComponent.$set({ viewportScale });

  onMount(() => {    
    editorComponent = new editor({
      target,
      props: { shape: annotation.target.selector, computedStyle, transform, viewportScale }
    });

    editorComponent.$on('change', event => {
      editorComponent.$$set({ shape: event.detail });
      dispatch('change', event.detail);
    });

    editorComponent.$on('grab', event => dispatch('grab', event.detail));
    editorComponent.$on('release', event => dispatch('release', event.detail));

    return () => {
      editorComponent.$destroy();
    }
  });
</script>