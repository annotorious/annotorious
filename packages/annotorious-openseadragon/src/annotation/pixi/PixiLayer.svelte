<script lang="ts" generics="I extends Annotation, E extends unknown">
  import { simplifyMultiPolygon, simplifyPolygon } from '@annotorious/annotorious/src';
  import { createEventDispatcher, onMount } from 'svelte';
  import OpenSeadragon from 'openseadragon';
  import type { Annotation, DrawingStyleExpression, StoreChangeEvent, Update } from '@annotorious/core';
  import { isImageAnnotation, ShapeType } from '@annotorious/annotorious';
  import type { Filter, ImageAnnotation, ImageAnnotatorState, MultiPolygon, Polygon } from '@annotorious/annotorious';
  import type { PixiLayerClickEvent } from './PixiLayerClickEvent';
  import { createStage } from './stageRenderer';

  import './PixiLayer.css';

  /** Props */
  export let filter: Filter<I> | undefined;
  export let state: ImageAnnotatorState<I, E>;
  export let style: DrawingStyleExpression<ImageAnnotation> | undefined;
  export let viewer: OpenSeadragon.Viewer;
  export let visible = true;

  const { store, hover, selection, viewport } = state;
  
  const dispatch = createEventDispatcher<{ click: PixiLayerClickEvent<I>}>();

  let stage: ReturnType<typeof createStage>;

  let lastPress: { x: number, y: number } | undefined;

  $: stage?.setFilter(filter as Filter<ImageAnnotation> | undefined);

  $: stage?.setSelected($selection);

  $: stage?.setStyle(style);

  $: stage?.setVisible(visible);

  // Helper
  const getImageXY = (xy: OpenSeadragon.Point): OpenSeadragon.Point => {
    const offsetXY = new OpenSeadragon.Point(xy.x, xy.y);
    const {x, y} = viewer.viewport.pointFromPixel(offsetXY);
    return viewer.viewport.viewportToImageCoordinates(x, y);
  }

  const onCanvasPress = (evt: OpenSeadragon.CanvasPressEvent) => {
    const { x, y } = evt.position;
    lastPress = { x, y };
  }

  const onPointerMove = (canvas: HTMLCanvasElement) => (evt: PointerEvent) => {
    const {x, y} = getImageXY(new OpenSeadragon.Point(evt.offsetX, evt.offsetY));
    
    const hit = store.getAt(x, y, filter);
    if (hit) {
      canvas.classList.add('hover');

      if ($hover !== hit.id) {
        hover.set(hit.id);
        stage.setHovered(hit.id);
      }
    } else {
      canvas.classList.remove('hover');

      if ($hover) {
        hover.set(undefined);
        stage.setHovered(undefined);
      }
    }
  }

  const onCanvasRelease = (evt: OpenSeadragon.CanvasReleaseEvent) => {
    if (!lastPress) return;

    const originalEvent = evt.originalEvent as PointerEvent;

    const { x, y } = evt.position;
    const dx = x - lastPress.x;
    const dy = y - lastPress.y;

    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      const {x, y} = getImageXY(evt.position);
      const annotation = store.getAt(x, y, filter);

      if (annotation) {
        dispatch('click', { originalEvent, annotation });
      } else {
        dispatch('click', { originalEvent });
      }
    }

    lastPress = undefined;
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

    viewer.addHandler('canvas-press', onCanvasPress);
    viewer.addHandler('canvas-release', onCanvasRelease);
    viewer.addHandler('update-viewport', stage.redraw);
    viewer.addHandler('animation-finish', updateViewportState);

    const filterAnnotations = (t: I[]): ImageAnnotation[] => 
      t.filter(t => isImageAnnotation(t));

    const isImageAnnotationUpdate = (u: Update<I | ImageAnnotation>): u is Update<ImageAnnotation> =>
      isImageAnnotation(u.oldValue) && isImageAnnotation(u.newValue);

    const simplify = (a: ImageAnnotation) => {
      const { selector }  = a.target;

      if (selector.type === ShapeType.POLYGON) {
        const shape = simplifyPolygon(selector as Polygon);
        return {
          ...a,
          target: {
            ...a.target,
            selector: {
              ...shape
            }
          }
        }
      } else if (selector.type === ShapeType.MULTIPOLYGLON) {
        const shape = simplifyMultiPolygon(selector as MultiPolygon);
        return {
          ...a,
          target: {
            ...a.target,
            selector: {
              ...shape
            }
          }
        }
      } else {
        return a;
      }
    }
  
    const onStoreChange = (event: StoreChangeEvent<I>) => {
      const { created, updated, deleted } = event.changes;

      const simplifiedCreated = (created || [])
        .filter(i => isImageAnnotation(i))
        .map(simplify);

      simplifiedCreated.forEach(annotation => stage.addAnnotation(annotation));
      filterAnnotations((deleted || [])).forEach(annotation => stage.removeAnnotation(annotation));
      
      (updated || [])
        .filter(u => isImageAnnotationUpdate(u))
        .map(({ oldValue, newValue }) => ({ oldValue, newValue: simplify(newValue) }))
        .forEach(({ oldValue, newValue }) => stage.updateAnnotation(oldValue, newValue));

      if (currentViewportBounds) {
        const { x, y, width, height } = currentViewportBounds;

        const intersecting = store.getIntersecting(x, y, width, height);
        viewport.set(intersecting.map(a => a.id));
      } else {
        viewport.set(store.all().map(a => a.id));
      }
      
      stage.redraw();
    }

    store.observe(onStoreChange);

    return () => {
      canvas.removeEventListener('pointermove', moveHandler);

      observer.disconnect();

      viewer.removeHandler('canvas-press', onCanvasPress);
      viewer.removeHandler('canvas-release', onCanvasRelease);
      viewer.removeHandler('update-viewport', stage.redraw);
      viewer.removeHandler('animation-finish', updateViewportState);

      store.unobserve(onStoreChange);

      stage.destroy();

      canvas.parentNode?.removeChild(canvas);
    }
  });
</script>
