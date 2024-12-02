<script lang="ts">
  import {
    createEventDispatcher,
    onMount,
    type Component,
    mount,
    unmount,
  } from 'svelte';
  import type { Transform } from '../Transform';
  import type { Shape } from 'src/model';
  import type { DrawingMode } from 'src/AnnotoriousOpts';

  const dispatch = createEventDispatcher<{ create: Shape }>();

  /** Props **/
  const {
    drawingMode,
    target,
    tool,
    transform,
    viewportScale,
  }: {
    drawingMode: DrawingMode;
    target: SVGGElement;
    tool: Component;
    transform: Transform;
    viewportScale: number;
  } = $props();

  let toolProps = $derived({
    addEventListener,
    drawingMode,
    transform,
    viewportScale,
  });

  onMount(() => {
    const svg = target.closest('svg');

    const cleanup: Function[] = [];

    const addEventListener = (
      name: keyof SVGSVGElementEventMap,
      handler: EventListenerOrEventListenerObject,
      capture?: boolean,
    ) => {
      svg?.addEventListener(name, handler, capture);
      cleanup.push(() => svg?.removeEventListener(name, handler, capture));
    };

    const toolComponent = mount(tool, {
      target,
      props: {
        ...toolProps,
        // TODO: Adding explicit 'any'
        oncreate: (event: any) => dispatch('create', event.detail),
      },
    });

    return () => {
      cleanup.forEach((fn) => fn());
      unmount(toolComponent);
    };
  });
</script>
