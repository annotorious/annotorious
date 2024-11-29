<script lang="ts">
  import type { DrawingStyleExpression } from '@annotorious/core';
  import {
    createEventDispatcher,
    mount,
    onMount,
    type Component,
    type SvelteComponent,
  } from 'svelte';
  import type { ImageAnnotation, Shape, ShapeType } from '../../model';
  import { computeStyle } from '../utils/styling';
  import type { Transform } from '../Transform';
  import type { EditorComponent } from './editorsRegistry';

  const dispatch = createEventDispatcher<{
    grab: PointerEvent;
    release: PointerEvent;
    change: Shape;
  }>();

  /** Props */

  const {
    annotation,
    editor,
    style,
    target,
    transform,
    viewportScale,
  }: {
    annotation: ImageAnnotation;
    editor: EditorComponent;
    style: DrawingStyleExpression<ImageAnnotation> | undefined;
    target: SVGGElement;
    transform: Transform;
    viewportScale: number;
  } = $props();

  let computedStyle = $derived(computeStyle(annotation, style));

  let shape = $derived(annotation ? annotation.target.selector : undefined);

  let editorProps = $derived({
    transform,
    viewportScale,
    computedStyle,
    shape,
  });

  onMount(() => {
    // @ts-ignore I think this one might be ok?
    mount(editor, {
      target,
      events: {
        // TODO restore shapechange event.
        //  'change':  (event) => {
        //       editorComponent.$$set({ shape: event.detail });
        //       dispatch('change', event.detail);
        //     }
      },
      props: editorProps,
    });

    // TODO resotre listeners
    // editorComponent.$on('grab', (event) => dispatch('grab', event.detail));
    // editorComponent.$on('release', (event) =>
    //   dispatch('release', event.detail),
    // );

    // return () => {
    //   editorComponent.$destroy();
    // };
  });
</script>
