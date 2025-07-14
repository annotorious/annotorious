<script lang="ts" generics="I extends Annotation, E extends unknown">
  import { type SvelteComponent, onMount } from 'svelte';
  import { v4 as uuidv4 } from 'uuid';
  import type { Annotation, DrawingStyleExpression, StoreChangeEvent, User } from '@annotorious/core';
  import { isImageAnnotation, ShapeType } from '../model';
  import type { ImageAnnotation, Shape} from '../model';
  import { getEditor, EditorMount } from './editors';
  import { Ellipse, Line, MultiPolygon, Polygon, Polyline, Rectangle} from './shapes';
  import { getTool, listDrawingTools, ToolMount } from './tools';
  import { enableResponsive } from './utils';
  import { createSVGTransform } from './Transform';
  import { addEventListeners, getSVGPoint } from './SVGAnnotationLayerPointerEvent';
  import type { SvelteImageAnnotatorState } from 'src/state';
  import type { DrawingMode } from 'src/AnnotoriousOpts';

  /** Props **/
  export let drawingEnabled: boolean;
  export let image: HTMLImageElement | HTMLCanvasElement;
  export let preferredDrawingMode: DrawingMode;
  export let state: SvelteImageAnnotatorState<I, E>;
  export let style: DrawingStyleExpression<ImageAnnotation> | undefined = undefined;
  export let toolName: string = listDrawingTools()[0];
  export let user: User;
  export let visible = true;

  // Trick to force tool re-mounting on cancelDrawing
  let toolMountKey = 0;

  /** API methods */
  export const cancelDrawing = () => toolMountKey += 1;
  export const getDrawingTool = () => toolName;
  export const isDrawingEnabled = () => drawingEnabled;

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
  const { hover, selection, store } = state;

  $: ({ onPointerDown, onPointerUp } = addEventListeners(svgEl, store));

  let storeObserver: (event: StoreChangeEvent<I>) => void | undefined;

  let editableAnnotations: ImageAnnotation[] | undefined;

  $: trackSelection($selection.selected);

  const trackSelection = (selected: { id: string, editable?: boolean }[]) => {
    if (storeObserver)
      store.unobserve(storeObserver);

    // Track only editable annotations
    const editableIds = 
      selected.filter(({ editable }) => editable).map(({ id }) => id);

    if (editableIds.length > 0) {
      // Resolve selected IDs from the store
      editableAnnotations = editableIds
        .map(id => store.getAnnotation(id)!)
        .filter(a => a && isImageAnnotation(a));

      // Track updates on the editable annotations
      storeObserver = (event: StoreChangeEvent<I>) => {
        const { updated } = event.changes;
        editableAnnotations = updated?.map(change => change.newValue) as unknown as ImageAnnotation[];
      }   
      
      store.observe(storeObserver, { annotations: editableIds });
    } else {
      editableAnnotations = undefined;
    }
  }

  const onSelectionCreated = <S extends Shape>(evt: CustomEvent<S>) => {
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

    store.addAnnotation(annotation as unknown as Partial<I>);

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

  const onPointerMove = (evt: PointerEvent) => {
    const { x, y } = getSVGPoint(evt, svgEl);

    const hit = store.getAt(x, y, undefined, 2);
    if (hit) {
      if ($hover !== hit.id) {
        hover.set(hit.id);
      }
    } else {
      hover.set(undefined);
    }
  }

  // [annotation -> editor] - note that we may not have editors available for
  // all annotations, because they might rely on plugins in some cases!
  $: editors = editableAnnotations ? editableAnnotations.map(annotation => ({ 
    annotation, editor: getEditor(annotation.target.selector)! 
  })).filter(t => t.editor) : undefined; 

  $: isEditable = (a: ImageAnnotation) => editors && editors.some(t => t.annotation.id === a.id);
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<svg
  bind:this={svgEl}
  role="application"
  tabindex={0}
  class="a9s-annotationlayer"
  class:drawing={tool}
  class:editing={editableAnnotations}
  class:hidden={!visible}
  class:hover={$hover}
  on:pointerup={onPointerUp}
  on:pointerdown={onPointerDown}
  on:pointermove={onPointerMove}>
  <g>
    {#each $store.filter(a => isImageAnnotation(a)) as annotation}
      {#if isImageAnnotation(annotation) && !isEditable(annotation)}
        {@const selector = annotation.target.selector}
        {#key annotation}
          {#if (selector?.type === ShapeType.ELLIPSE)}
            <Ellipse 
              annotation={annotation}
              isNoneSelection={selection.userSelectAction === "NONE"}
              geom={selector?.geometry} 
              style={style} />
          {:else if (selector?.type === ShapeType.RECTANGLE)}
            <Rectangle 
              annotation={annotation}
              isNoneSelection={selection.userSelectAction === "NONE"}
              geom={selector.geometry} 
              style={style} />
          {:else if (selector?.type === ShapeType.POLYGON)}
            <Polygon 
              annotation={annotation}
              isNoneSelection={selection.userSelectAction === "NONE"}
              geom={selector.geometry} 
              style={style} />
          {:else if (selector?.type === ShapeType.MULTIPOLYGON)}
            <MultiPolygon
              annotation={annotation}
              geom={selector.geometry}
              style={style} />
          {:else if (selector?.type === ShapeType.POLYLINE)}
            <Polyline 
              annotation={annotation} 
              geom={selector.geometry}
              style={style} />
          {:else if (selector?.type === ShapeType.LINE)}
            <Line
              annotation={annotation}
              geom={selector.geometry}
              style={style} />
          {/if}
        {/key}
      {/if}
    {/each}
  </g>

  <g 
    bind:this={drawingEl}
    class="drawing" >
    {#if drawingEl}
      {#if editors}
        {#each editors as editable}
          {#key editable.annotation.id}        
            <EditorMount
              target={drawingEl}
              editor={editable.editor}
              annotation={editable.annotation}
              style={style}
              transform={transform}
              viewportScale={$scale}
              on:change={onChangeSelected(editable.annotation)} />
          {/key}
        {/each}
      {:else if (tool && drawingEnabled)} 
        {#key `${toolName}-${toolMountKey}`}
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
