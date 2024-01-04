<script lang="ts">
  import { SvelteComponent, onMount } from 'svelte';
  import { v4 as uuidv4 } from 'uuid';
  import type { DrawingStyle, StoreChangeEvent, User } from '@annotorious/core';
  import { ShapeType } from '../model';
  import type { ImageAnnotation, Shape} from '../model';
  import { getEditor as _getEditor, EditorMount } from './editors';
  import { Ellipse, Polygon, Rectangle} from './shapes';
  import { getTool, listDrawingTools, ToolMount } from './tools';
  import { enableResponsive } from './utils';
  import { createSVGTransform } from './Transform';
  import { addEventListeners } from './SVGAnnotationLayerPointerEvent';
  import type { SvelteImageAnnotatorState } from 'src/state';
  import type { DrawingMode } from 'src/AnnotoriousOpts';

  /** Props **/
  export let drawingEnabled: boolean;
  export let image: HTMLImageElement | HTMLCanvasElement;
  export let preferredDrawingMode: DrawingMode;
  export let state: SvelteImageAnnotatorState;
  export let style: DrawingStyle | ((annotation: ImageAnnotation) => DrawingStyle) | undefined = undefined;
  export let toolName: string = listDrawingTools()[0];
  export let user: User;

  $: ({ tool, opts } = getTool(toolName) || { tool: undefined, opts: undefined });

  $: drawingMode = opts?.drawingMode || preferredDrawingMode;

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

  let storeObserver: (event: StoreChangeEvent<ImageAnnotation>) => void | undefined;

  let editableAnnotations: ImageAnnotation[] | undefined;

  $: isEditable = (a: ImageAnnotation) => $selection.selected.find(s => s.id === a.id && s.editable);

  $: trackSelection($selection.selected);

  const trackSelection = (selected: { id: string, editable?: boolean }[]) => {
    if (storeObserver)
      store.unobserve(storeObserver);

    // Track only editable annotations
    const editableIds = 
      selected.filter(({ editable }) => editable).map(({ id }) => id);

    if (editableIds.length > 0) {
      // Resolve selected IDs from the store
      editableAnnotations = editableIds.map(id => store.getAnnotation(id)!).filter(Boolean);

      // Track updates on the editable annotations
      storeObserver = (event: StoreChangeEvent<ImageAnnotation>) => {
        const { updated } = event.changes;
        editableAnnotations = updated?.map(change => change.newValue);
      }   
      
      store.observe(storeObserver, { annotations: editableIds });
    } else {
      editableAnnotations = undefined;
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
        creator: user,
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

  // To get around lack of TypeScript support in Svelte markup
  const getEditor = (shape: Shape): typeof SvelteComponent => _getEditor(shape)!;
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
        {#key annotation.id}
          {#if (selector.type === ShapeType.ELLIPSE)}
            <Ellipse annotation={annotation} geom={selector.geometry} style={style} />
          {:else if (selector.type === ShapeType.RECTANGLE)}
            <Rectangle annotation={annotation} geom={selector.geometry} style={style} />
          {:else if (selector.type === ShapeType.POLYGON)}
            <Polygon annotation={annotation} geom={selector.geometry} style={style} />
          {/if}
        {/key}
      {/if}
    {/each}
  </g>

  <g 
    bind:this={drawingEl}
    class="drawing" >
    {#if drawingEl}
      {#if editableAnnotations}
        {#each editableAnnotations as editable}
          {#key editable.id}
            <EditorMount
              target={drawingEl}
              editor={getEditor(editable.target.selector)}
              annotation={editable}
              style={style}
              transform={transform}
              viewportScale={$scale}
              on:change={onChangeSelected(editable)} />
          {/key}
        {/each}
      {:else if (tool && drawingEnabled)} 
        {#key toolName}
          <ToolMount 
            target={drawingEl}
            tool={tool}
            drawingMode={drawingMode}
            transform={transform}
            viewportScale={$scale}
            on:create={onSelectionCreated} />
        {/key}
      {/if}
    {/if}
  </g>
</svg>