<script type="ts">
  import type { SvelteComponent } from 'svelte';
  import { v4 as uuidv4 } from 'uuid';
  import OpenSeadragon from 'openseadragon';
  import type { StoreChangeEvent, User } from '@annotorious/core';
  import { getEditor } from '@annotorious/annotorious/src';
  import type { ImageAnnotation, Shape, ImageAnnotatorState, DrawingMode } from '@annotorious/annotorious/src';
  import OSDLayer from '../OSDLayer.svelte';
    import ToolMount from '@annotorious/annotorious/src/annotation/tools/ToolMount.svelte';
    import EditorMount from '@annotorious/annotorious/src/annotation/editors/EditorMount.svelte';
    
  /** Props **/
  export let drawingEnabled: boolean;
  export let drawingMode: DrawingMode;
  export let state: ImageAnnotatorState;
  export let tool: typeof SvelteComponent = null;
  export let user: User;
  export let viewer: OpenSeadragon.Viewer;

  /** Drawing tool layer **/
  let drawingEl: SVGGElement;

  /** Tool lifecycle **/
  $: tool ? viewer.setMouseNavEnabled(false) : viewer.setMouseNavEnabled(true); 

  $: tool && selection.clear();

  /** Selection tracking **/
  const { store, selection } = state;

  let storeObserver = null;

  let editableAnnotations: ImageAnnotation[] = null;
 
  $: if ($selection.selected.length === 0 && keepEnabled && tool) { viewer.setMouseNavEnabled(false) }
  
  $: trackSelection($selection.selected);

  const trackSelection = (selected: { id: string, editable?: boolean}[]) => {
    store.unobserve(storeObserver);

    // Track only editable annotations
    const editableIds = 
      selected.filter(({ editable }) => editable).map(({ id }) => id);

    if (editableIds.length > 0) {
      // Resolve selected IDs from the store
      editableAnnotations = editableIds.map(id => store.getAnnotation(id));

      // Track updates on the selected annotations
      storeObserver = (event: StoreChangeEvent<ImageAnnotation>) => {
        const { updated } = event.changes;
        editableAnnotations = updated.map(change => change.newValue);
      }   
      
      store.observe(storeObserver, { annotations: editableIds });
    } else {
      editableAnnotations = null;
    }
  }

  // Coordinate transform, element offset to OSD image coordinates
  const toolTransform = (offsetX: number, offsetY: number): [number, number] => {
    const {x, y} = viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(offsetX, offsetY));
    return [x, y];
  }

  const onGrab = () => viewer.setMouseNavEnabled(false);
  
  const onRelease = () => viewer.setMouseNavEnabled(true);

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
      updated: isUpdate ? new Date() : null,
      updatedBy: isUpdate ? user : null
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

    if (!keepEnabled)
      tool = null;
  }

  // A typecasting helper, because 'as' doesn't work in Svelte markup
  const cast = <T extends Shape>(x: Shape) => x as T;
</script>

<OSDLayer viewer={viewer} let:transform let:scale>
  <svg 
    class="a9s-annotationlayer a9s-osd-drawinglayer"
    class:drawing={tool}>

    <g 
      bind:this={drawingEl}
      class="drawing"
      transform={transform}>
      {#if editableAnnotations}
        {#each editableAnnotations as editable}
          <EditorMount
            target={drawingEl}
            editor={getEditor(editable.target.selector)}
            annotation={editable}
            transform={{ elementToImage: toolTransform }}
            viewportScale={scale}
            on:grab={onGrab} 
            on:change={onChangeSelected(editable)}
            on:release={onRelease} />
        {/each}
      {:else if (tool && drawingEnabled)} 
        <ToolMount
          target={drawingEl}
          tool={tool}
          drawingMode={drawingMode}
          transform={{ elementToImage: toolTransform }}
          viewportScale={scale}
          on:create={onSelectionCreated} />
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