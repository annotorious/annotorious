<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import OpenSeadragon from 'openseadragon';
  import type { DrawingStyle, Filter, ImageAnnotation, ImageAnnotatorState } from '@annotorious/annotorious';
  import type { PixiLayerClickEvent } from './PixiLayerClickEvent';
  import { createStage } from './stageRenderer';

  import './PixiLayer.css';

  /** Props */
  export let filter: Filter<ImageAnnotation> | undefined;
  export let state: ImageAnnotatorState;
  export let style: DrawingStyle | ((annotation: ImageAnnotation) => DrawingStyle) | undefined;
  export let viewer: OpenSeadragon.Viewer;

  const { store, hover, selection, viewport } = state;
  
  const dispatch = createEventDispatcher<{ click: PixiLayerClickEvent}>();

  let stage: ReturnType<typeof createStage>;

  let dragged = false;

  $: stage?.setFilter(filter);

  $: stage?.setSelected($selection);

  $: stage?.setStyle(style);

  // Helper
  const getImageXY = (xy: OpenSeadragon.Point): OpenSeadragon.Point => {
    const offsetXY = new OpenSeadragon.Point(xy.x, xy.y);
    const {x, y} = viewer.viewport.pointFromPixel(offsetXY);
    return viewer.viewport.viewportToImageCoordinates(x, y);
  }

  const onPointerMove = (canvas: HTMLCanvasElement) => (evt: PointerEvent) => {
    const {x, y} = getImageXY(new OpenSeadragon.Point(evt.offsetX, evt.offsetY));
    
    const hit = store.getAt(x, y);
    const isVisibleHit = hit && (!filter || filter(hit));

    if (isVisibleHit) {
      canvas.classList.add('hover');

      if ($hover !== hit.id)
        hover.set(hit.id);
    } else {
      canvas.classList.remove('hover');

      if ($hover)
        hover.set(undefined);
    }
  }

  const onCanvasRelease = (evt: OpenSeadragon.CanvasReleaseEvent) => {
    const originalEvent = evt.originalEvent as PointerEvent;

    if (!dragged) {
      const {x, y} = getImageXY(evt.position);
      const annotation = store.getAt(x, y);

      if (annotation)
        dispatch('click', { originalEvent, annotation });
      else
        dispatch('click', { originalEvent });
    }

    dragged = false;
  }

  const onCanvasDrag = (evt: OpenSeadragon.CanvasDragEvent) => {
    const {x, y} = evt.delta;
    const dist = Math.sqrt(x * x + y * y);
    dragged = dist > 5;
  }

  let currentViewportBounds: { x: number, y: number, width: number, height: number };

  onMount(() => {
    const { offsetWidth, offsetHeight } = viewer.canvas;

    // Create Canvas element
    const canvas = document.createElement('canvas');
    canvas.width = offsetWidth;
    canvas.height = offsetHeight;
    canvas.className = 'a9s-gl-canvas';

    viewer.element.querySelector('.openseadragon-canvas')?.appendChild(canvas);

    // Create Pixi stage
    stage = createStage(viewer, canvas);

    // Event handlers
    const moveHandler = onPointerMove(canvas);
    canvas.addEventListener('pointermove', moveHandler); 

    const observer = new ResizeObserver(entries => {
      try {
        const { width, height } = entries[0].contentRect;

        canvas.width = width;
        canvas.height = height;
        
        stage.resize(width, height);
      } catch {
        console.warn('WebGL canvas already disposed');
      }
    });

    observer.observe(canvas);

    const updateViewportState = () => {
      const viewportBounds = viewer.viewport.getBounds();
      currentViewportBounds = viewer.viewport.viewportToImageRectangle(viewportBounds);

      const { x, y, width, height } = currentViewportBounds;

      const intersecting = store.getIntersecting(x, y, width, height);
      viewport.set(intersecting.map(a => a.id));
    }

    viewer.addHandler('canvas-drag', onCanvasDrag);
    viewer.addHandler('canvas-release', onCanvasRelease);
    viewer.addHandler('update-viewport', stage.redraw);
    viewer.addHandler('animation-finish', updateViewportState);

    return () => {
      canvas.removeEventListener('pointermove', moveHandler);

      viewer.removeHandler('canvas-drag', onCanvasDrag);
      viewer.removeHandler('canvas-release', onCanvasRelease);
      viewer.removeHandler('update-viewport', stage.redraw);
      viewer.removeHandler('animation-finish', updateViewportState);

      stage.destroy();

      canvas.parentNode?.removeChild(canvas);
    }
  });

  store.observe(event => {
    const { created, updated, deleted } = event.changes;

    (created || []).forEach(annotation => stage.addAnnotation(annotation));

    (updated || []).forEach(({ oldValue, newValue }) => stage.updateAnnotation(oldValue, newValue));

    (deleted || []).forEach(annotation => stage.removeAnnotation(annotation));

    if (currentViewportBounds) {
      const { x, y, width, height } = currentViewportBounds;

      const intersecting = store.getIntersecting(x, y, width, height);
      viewport.set(intersecting.map(a => a.id));
    } else {
      viewport.set(store.all().map(a => a.id));
    }
    
    stage.redraw();
  });
</script>
