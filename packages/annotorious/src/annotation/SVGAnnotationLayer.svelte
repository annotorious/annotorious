<script type="ts">
  import { onMount, type SvelteComponent } from 'svelte';
  import { v4 as uuidv4 } from 'uuid';
  import type { StoreChangeEvent } from '@annotorious/core';
  import { ShapeType } from '../model';
  import type { ImageAnnotation, Shape} from '../model';
  import { getEditor } from './editors';
  import { Ellipse, Polygon, Rectangle} from './shapes';
  import { getTool, Tool } from './tools';
  import { enableResponsive } from './utils';
  import { createSVGTransform } from './Transform';
  import { addEventListeners } from './SVGAnnotationLayerPointerEvent';
  import type { SvelteImageAnnotatorState } from 'src/state';

  /** Props **/
  export let image: HTMLImageElement | HTMLCanvasElement;
  export let state: SvelteImageAnnotatorState;
  export let tool: typeof SvelteComponent = getTool('rectangle');

  /** Drawing tool layer **/
  let drawingEl: SVGGElement;

  /** Responsive scaling **/
  let svgEl: SVGSVGElement;
    
  let scale: ReturnType<typeof enableResponsive>;

  onMount(() => scale = enableResponsive(image, svgEl));

  $: transform = createSVGTransform(svgEl);

  /** Selection tracking */
  const { selection, store } = state;

  $: ({ onPointerDown, onPointerUp } = addEventListeners(svgEl, store));

  let storeObserver = null;

  let editableAnnotations: ImageAnnotation[] = null;

  $: isEditable = (a: ImageAnnotation) => $selection.selected.find(s => s.id === a.id && s.editable);

  $: trackSelection($selection.selected);

  const trackSelection = (selected: { id: string, editable?: boolean }[]) => {
    store.unobserve(storeObserver);

    // Track only editable annotations
    const editableIds = 
      selected.filter(({ editable }) => editable).map(({ id }) => id);

    if (editableIds.length > 0) {
      // Resolve selected IDs from the store
      editableAnnotations = editableIds.map(id => store.getAnnotation(id));

      // Track updates on the editable annotations
      storeObserver = (event: StoreChangeEvent<ImageAnnotation>) => {
        const { updated } = event.changes;
        editableAnnotations = updated.map(change => change.newValue);
      }   
      
      store.observe(storeObserver, { annotations: editableIds });
    } else {
      editableAnnotations = null;
    }
  }

  const onSelectionCreated = <T extends Shape>(evt: CustomEvent<T>) => {
    const id = uuidv4();

    const annotation: ImageAnnotation = {
      id,
      bodies: [],
      target: {
        annotation: id,
        selector: evt.detail,
        creator: null,
        created: new Date()
      }
    };

    store.addAnnotation(annotation);

    selection.setSelected(annotation.id);
  }

  const onChangeSelected = (annotation: ImageAnnotation) => (event: CustomEvent<Shape>) => {  
    const { target } = annotation;

    // We don't consider a shape edit an 'update' if it happens within 10mins
    const GRACE_PERIOD = 10 * 60 * 1000;

    const isUpdate = 
      // target.creator?.id !== user.id ||
      !target.created ||
      new Date().getTime() - target.created.getTime() > GRACE_PERIOD;

    store.updateTarget({
      ...target,
      selector: event.detail,
      created: isUpdate ? target.created : new Date(),
      updated: isUpdate ? new Date() : null,
      //updatedBy: isUpdate ? user : null
    });
  }
</script>

<svg
  bind:this={svgEl}
  class="a9s-annotationlayer"
  class:drawing={tool}
  on:pointerup={onPointerUp}
  on:pointerdown={onPointerDown}>
  
  <g>
    {#each $store as annotation}
      {#if !isEditable(annotation)}
        {@const selector = annotation.target.selector}

        {#if (selector.type === ShapeType.ELLIPSE)}
          <Ellipse geom={selector.geometry} />
        {:else if (selector.type === ShapeType.RECTANGLE)}
          <Rectangle geom={selector.geometry} />
        {:else if (selector.type === ShapeType.POLYGON)}
          <Polygon geom={selector.geometry} />
        {/if}
      {/if}
    {/each}
  </g>

  <g 
    bind:this={drawingEl}
    class="drawing" >

    {#if editableAnnotations}
      {#each editableAnnotations as editable}
        <svelte:component 
          this={getEditor(editable.target.selector)}
          shape={editable.target.selector}
          transform={transform}
          viewportScale={$scale}
          on:change={onChangeSelected(editable)} />
      {/each}
    {:else if drawingEl && tool} 
      {#key tool}
        <Tool 
          target={drawingEl}
          tool={tool}
          transform={transform}
          viewportScale={$scale}
          on:create={onSelectionCreated} />
      {/key}
    {/if}
  </g>
</svg>