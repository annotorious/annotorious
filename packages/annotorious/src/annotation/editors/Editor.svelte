<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Shape } from '../../model';
  import type { Transform } from '../Transform';

  const dispatch = createEventDispatcher<{ grab: PointerEvent, release: PointerEvent, change: Shape }>();

  /** Props */
  export let shape: Shape;
  export let editor: (shape: Shape, handle: string, delta: [number, number]) => Shape;
  export let transform: Transform;
  export let svgEl: SVGSVGElement;

  let grabbedHandle: string | undefined;

  let origin: [number, number];

  let initialShape: Shape | undefined;

  const onGrab = (handle: string) => (evt: PointerEvent) => {
    grabbedHandle = handle;

    // For legacy compatibility: offsetX and offsetY are not
    // available on synthetic events, currently used by the
    // new PolygonEditor. Old versions of Annotorious, however, 
    // won't yet forward the svgEl prop!
    if (svgEl) {
      // Convert screen px to element-local px so the input space matches
      // elementToImage's offsetX-style contract when an ancestor CSS transform
      // makes the bounding box differ from the layout box.
      const { left, top, width, height } = svgEl.getBoundingClientRect();
      const offsetX = (evt.clientX - left) * (svgEl.clientWidth / width);
      const offsetY = (evt.clientY - top) * (svgEl.clientHeight / height);

      origin = transform.elementToImage(offsetX, offsetY);
    } else {
      const { offsetX, offsetY } = evt;
      origin = transform.elementToImage(offsetX, offsetY);
    }

    initialShape = shape;

    const target = evt.target as Element;
    target.setPointerCapture(evt.pointerId);

    dispatch('grab', evt);
  }

  const onPointerMove = (evt: PointerEvent) => {
    if (grabbedHandle) {
      const [x, y] = transform.elementToImage(evt.offsetX, evt.offsetY);

      const delta: [number, number] = [x - origin[0], y - origin[1]];

      shape = editor(initialShape!, grabbedHandle, delta);
      
      dispatch('change', shape);
    }
  }

  const onRelease = (evt: PointerEvent) => {    
    const target = evt.target as Element;
    target.releasePointerCapture(evt.pointerId);

    grabbedHandle = undefined;

    initialShape = shape;
    
    dispatch('release', evt);
  }
</script>

<g
  class="a9s-annotation selected"
  on:pointerup={onRelease}
  on:pointermove={onPointerMove}>

  <slot grab={onGrab} />
</g>