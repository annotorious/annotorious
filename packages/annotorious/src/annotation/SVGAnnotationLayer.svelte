<script lang="ts" generics="I extends Annotation, E extends unknown">
  import { v4 as uuidv4 } from 'uuid';
  import type { Annotation, StoreChangeEvent } from '@annotorious/core';
  import { isImageAnnotation, ShapeType } from '../model';
  import type { ImageAnnotation, Shape } from '../model';
  import { EditorMount, getEditor } from './editors';
  import { Ellipse, Polygon, Rectangle } from './shapes';
  import { getTool, ToolMount } from './tools';
  import { enableResponsive } from './utils';
  import { createSVGTransform } from './Transform';
  import {
    addEventListeners,
    getSVGPoint,
  } from './SVGAnnotationLayerPointerEvent';
  import type { SVGLayerProps } from './types';

  /** Props **/

  const {
    drawingEnabled,
    image,
    preferredDrawingMode,
    imageAnnotatorState,
    style = undefined,
    toolName = undefined,
    user,
    visible = true,
  }: SVGLayerProps<I, E> = $props();

  /** API methods */
  export const getDrawingTool = () => toolName;
  export const isDrawingEnabled = () => drawingEnabled;

  let { tool, opts } = $derived(
    toolName !== undefined
      ? getTool(toolName)
      : {
          tool: undefined,
          opts: {
            drawingMode: preferredDrawingMode,
          },
        },
  );

  // TODO: I don't understand below code: if opts.drawingMode is explicitly false, we still
  // override to preferredDrawingMode?
  let drawingMode = $derived(opts?.drawingMode || preferredDrawingMode);

  /** Drawing tool layer **/
  let drawingEl: SVGGElement | undefined = $state(undefined);

  /** Responsive scaling **/
  let svgEl: SVGSVGElement | undefined = $state(undefined);

  let transform = $derived(
    svgEl === undefined ? undefined : createSVGTransform(svgEl),
  );

  let scale: ReturnType<typeof enableResponsive>;

  $effect(() => {
    // Enable responsivity once the bound svg is present
    if (svgEl) {
      enableResponsive(image, svgEl);
    }
  });

  /** Selection tracking */
  const { hover, selection, store } = imageAnnotatorState;

  let { onPointerDown, onPointerUp } = $derived(
    svgEl
      ? addEventListeners(svgEl, store)
      : { onPointerDown: () => {}, onPointerUp: () => {} },
  );

  let storeObserver: (event: StoreChangeEvent<I>) => void | undefined;

  let editableAnnotations: ImageAnnotation[] | undefined = $state(undefined);

  let isEditable = $derived((a: ImageAnnotation) =>
    $selection.selected.find((s) => s.id === a.id && s.editable),
  );

  const trackSelection = (selected: { id: string; editable?: boolean }[]) => {
    if (storeObserver) store.unobserve(storeObserver);

    // Track only editable annotations
    const editableIds = selected
      .filter(({ editable }) => editable)
      .map(({ id }) => id);

    if (editableIds.length > 0) {
      // Resolve selected IDs from the store
      editableAnnotations = editableIds
        .map((id) => store.getAnnotation(id)!)
        .filter((a) => a && isImageAnnotation(a));

      // Track updates on the editable annotations
      storeObserver = (event: StoreChangeEvent<I>) => {
        const { updated } = event.changes;
        editableAnnotations = updated?.map(
          (change) => change.newValue,
        ) as unknown as ImageAnnotation[];
      };

      store.observe(storeObserver, { annotations: editableIds });
    } else {
      editableAnnotations = undefined;
    }
  };

  $effect(() => trackSelection($selection.selected));

  const onSelectionCreated = <S extends Shape>(evt: CustomEvent<S>) => {
    const id = uuidv4();

    const annotation: ImageAnnotation = {
      id,
      bodies: [],
      target: {
        annotation: id,
        selector: evt.detail,
        creator: user,
        created: new Date(),
      },
    };

    store.addAnnotation(annotation as unknown as Partial<I>);

    selection.setSelected(annotation.id);
  };

  const onChangeSelected =
    (annotation: ImageAnnotation) => (event: CustomEvent<Shape>) => {
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
        updatedBy: isUpdate ? user : undefined,
      });
    };

  let onPointerMove = $derived.by(() => {
    if (svgEl === undefined) return;
    return (evt: PointerEvent) => {
      // @ts-expect-error this is never going to change back so is safe -- still
      // probably a better way to do this.

      const { x, y } = getSVGPoint(evt, svgEl);

      const hit = store.getAt(x, y);
      if (hit) {
        if ($hover !== hit.id) {
          hover.set(hit.id);
        }
      } else {
        hover.set(undefined);
      }
    };
  });

  // To get around lack of TypeScript support in Svelte markup
</script>

<svg
  bind:this={svgEl}
  class="a9s-annotationlayer"
  class:drawing={tool}
  class:hidden={!visible}
  class:hover={$hover}
  onpointerup={onPointerUp}
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
>
  <g>
    {#each $store.filter((a) => isImageAnnotation(a)) as annotation}
      {#if isImageAnnotation(annotation) && !isEditable(annotation)}
        {@const selector = annotation.target.selector}
        {#key annotation.id}
          {#if selector?.type === ShapeType.ELLIPSE}
            <Ellipse {annotation} geom={selector?.geometry} {style} />
          {:else if selector?.type === ShapeType.RECTANGLE}
            <Rectangle {annotation} geom={selector.geometry} {style} />
          {:else if selector?.type === ShapeType.POLYGON}
            <Polygon {annotation} geom={selector.geometry} {style} />
          {/if}
        {/key}
      {/if}
    {/each}
  </g>

  <g bind:this={drawingEl} class="drawing">
    {#if drawingEl && transform}
      {#if editableAnnotations}
        {#each editableAnnotations as editable}
          {@const editor = getEditor(editable.target.selector.type)}
          {#if editor}
            {#key editable.id}
              <!-- https://github.com/storybookjs/storybook/issues/29308 -->
              <EditorMount
                target={drawingEl}
                {editor}
                annotation={editable}
                {style}
                {transform}
                viewportScale={$scale}
                on:change={onChangeSelected(editable)}
              />
            {/key}
          {/if}
        {/each}
      {:else if tool && drawingEnabled}
        {#key toolName}
          <ToolMount
            target={drawingEl}
            {tool}
            {drawingMode}
            {transform}
            viewportScale={$scale}
            on:create={onSelectionCreated}
          />
        {/key}
      {/if}
    {/if}
  </g>
</svg>
