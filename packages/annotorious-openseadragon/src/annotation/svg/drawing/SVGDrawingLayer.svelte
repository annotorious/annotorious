<script lang="ts">
  import { SvelteComponent } from 'svelte';
  import { v4 as uuidv4 } from 'uuid';
  import OpenSeadragon from 'openseadragon';
  import type { DrawingStyleExpression, Filter, StoreChangeEvent, User } from '@annotorious/core';
  import { EditorMount } from '@annotorious/annotorious/src'; // Import Svelte components from source
  import { getEditor as _getEditor, getTool, listDrawingTools } from '@annotorious/annotorious';
  import type { ImageAnnotation, Shape, ImageAnnotatorState, DrawingMode } from '@annotorious/annotorious';
  import OSDLayer from '../OSDLayer.svelte';
  import OSDToolMount from './OSDToolMount.svelte';

  /** Props **/
  export let drawingEnabled: boolean;
  export let filter: Filter<ImageAnnotation> | undefined;
  export let preferredDrawingMode: DrawingMode;
  export let state: ImageAnnotatorState;
  export let style: DrawingStyleExpression<ImageAnnotation> | undefined = undefined;
  export let toolName: string = listDrawingTools()[0];
  export let user: User;
  export let viewer: OpenSeadragon.Viewer;

  // I hate you
  const isFirefox = navigator.userAgent.match(/firefox|fxios/i);

  $: ({ tool, opts } = getTool(toolName) || { tool: undefined, opts: undefined });

  /** Drawing tool layer **/
  let drawingEl: SVGGElement;

  /** Tool lifecycle **/
  $: drawingMode = opts?.drawingMode || preferredDrawingMode;

  $: drawingEnabled && drawingMode === 'drag' ? viewer.setMouseNavEnabled(false) : viewer.setMouseNavEnabled(true); 

  $: drawingEnabled && selection.clear();

  /** Selection tracking **/
  const { store, selection, hover } = state;

  let storeObserver: (event: StoreChangeEvent<ImageAnnotation>) => void;

  let editableAnnotations: ImageAnnotation[] | undefined;

  let grabbedAt: number | undefined;
 
  $: if ($selection.selected.length === 0 && drawingMode === 'drag' && drawingEnabled) { viewer.setMouseNavEnabled(false) }

  $: trackSelection($selection.selected);

  const trackSelection = (selected: { id: string, editable?: boolean}[]) => {
    store.unobserve(storeObserver);

    // Track only editable annotations
    const editableIds = 
      selected.filter(({ editable }) => editable).map(({ id }) => id);

    if (editableIds.length > 0) {
      // Resolve selected IDs from the store
      editableAnnotations = editableIds.map(id => store.getAnnotation(id)!);

      // Track updates on the selected annotations
      storeObserver = (event: StoreChangeEvent<ImageAnnotation>) => {
        const { updated } = event.changes;
        editableAnnotations = (updated || []).map(change => change.newValue);
      }   
      
      store.observe(storeObserver, { annotations: editableIds });

      if (isFirefox) {
        // As of May 16, 2024 Firefox has the following fun bug: despite the SVG elements
        // being properly in the markup, FF DOES NOT RENDER THEM VISIBLY on the screen.
        // This doesn't always happen. I can't figure out a reliable pattern, but timing
        // must play a role. (It doesn't happen in the simple examples. But happens in 
        // the Recogito React-based interface.) 
        //
        // As soon as the first re-render is triggered, FF wakes up, and the shapes display
        // correctly. One reliable way of 'waking up' the FF renderer is to change the
        // transform attribute on an SVG element. By panning OpenSeadragon by one tenth of a 
        // pixel (!), we're triggering such a refresh without causing a change that's visible
        // to the user. *sigh* 
        const { width } = viewer.viewport.viewerElementToViewportRectangle(new OpenSeadragon.Rect(0, 0, 1, 1));
        viewer.viewport.panBy(new OpenSeadragon.Point(Math.abs(width / 10), 0));
      }
    } else {
      editableAnnotations = undefined;
    }
  }

  // Coordinate transform, element offset to OSD image coordinates
  const toolTransform = (offsetX: number, offsetY: number): [number, number] => {
    const {x, y} = viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(offsetX, offsetY));
    return [x, y];
  }

  const onGrab = (evt: CustomEvent<PointerEvent>) => {
    viewer.setMouseNavEnabled(false);

    // Record timestamp, so we can differentiate between actual
    // grab (edit) and click (possibly select overlapping shape)
    grabbedAt = evt.timeStamp;
  }

  const onRelease = (evt: CustomEvent<PointerEvent>) => { 
    viewer.setMouseNavEnabled(true);

    const timeDifference = performance.now() - (grabbedAt || 0);
    if (timeDifference < 300) {
      // Click - check if another shape needs selecting
      const { offsetX, offsetY } = evt.detail;
      const [x, y] = toolTransform(offsetX, offsetY);

      const hit = store.getAt(x, y);
      const isVisibleHit = hit && (!filter || filter(hit));

      if (isVisibleHit && !editableAnnotations!.find(e => e.id === hit.id)) {
        hover.set(hit.id);
        selection.setSelected(hit.id);
      }
    }
  }

  const onChangeSelected = (annotation: ImageAnnotation) => (event: CustomEvent<Shape>) => {  
    const { target } = annotation;

    // We don't consider a shape edit an 'update' if it happens within 10mins
    const GRACE_PERIOD = 10 * 60 * 1000;

    const isUpdate = 
      target.creator?.id !== user.id ||
      !target.created ||
      new Date().getTime() - target.created.getTime() > GRACE_PERIOD;

    store.updateTarget({
      ...target,
      selector: event.detail,
      created: isUpdate ? target.created : new Date(),
      updated: isUpdate ? new Date() : undefined,
      updatedBy: isUpdate ? user : undefined
    });
  }

  const onSelectionCreated = <T extends Shape>(evt: CustomEvent<T>) => {
    const id = uuidv4();

    const annotation: ImageAnnotation = {
      id,
      bodies: [],
      target: {
        annotation: id,
        selector: evt.detail,
        creator: user,
        created: new Date()
      }
    }

    store.addAnnotation(annotation);

    selection.setSelected(annotation.id);

    viewer.setMouseNavEnabled(true);
  }

  // To get around lack of TypeScript support in Svelte markup
  const getEditor = (shape: Shape): typeof SvelteComponent => _getEditor(shape)!;
</script>

<OSDLayer viewer={viewer} let:transform let:scale>
  <svg 
    class="a9s-annotationlayer a9s-osd-drawinglayer"
    class:drawing={drawingEnabled}>

    <g 
      bind:this={drawingEl}
      transform={transform}>
      {#if drawingEl && editableAnnotations}
        {#each editableAnnotations as editable}
          {#key editable.id}
            <EditorMount
              target={drawingEl}
              editor={getEditor(editable.target.selector)}
              annotation={editable}
              style={style}
              transform={{ elementToImage: toolTransform }}
              viewportScale={scale}
              on:grab={onGrab} 
              on:change={onChangeSelected(editable)}
              on:release={onRelease} />
            {/key}
        {/each}
      {:else if (drawingEl && tool && drawingEnabled)} 
        {#key toolName} 
          <OSDToolMount
            target={drawingEl}
            tool={tool}
            drawingMode={drawingMode}
            transform={{ elementToImage: toolTransform }}
            viewer={viewer}
            viewportScale={scale}
            on:create={onSelectionCreated} />
        {/key}
      {/if}
    </g>
  </svg>
</OSDLayer>

<style>
  svg {
    pointer-events: none;
  }
  
  svg.drawing {
    pointer-events: all;
  }

  svg * {
    pointer-events: all;
  }
</style>