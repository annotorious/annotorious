<script lang="ts" generics="I extends Annotation, E extends unknown">
  import OSDLayer from '../OSDLayer.svelte';
  import type { Annotation } from '@annotorious/core';
  import { isImageAnnotation, ShapeType } from '@annotorious/annotorious';
  import type { Bounds, ImageAnnotatorState } from '@annotorious/annotorious';
  import SelectedRectangle from './shapes/SelectedRectangle.svelte';
  import SelectedPolygon from './shapes/SelectedPolygon.svelte';
  import SelectedMultiPolygon from './shapes/SelectedMultiPolygon.svelte';
  import SelectedEllipse from './shapes/SelectedEllipse.svelte';
  import SelectedLine from './shapes/SelectedLine.svelte';

  /** Props **/
  export let state: ImageAnnotatorState<I, E>;
  export let viewer: OpenSeadragon.Viewer;

  const { store } = state;

  const { selection } = state;

  $: selectedAnnotations = $selection.selected.map(({ id }) => store.getAnnotation(id)!);

  $: union = selectedAnnotations.length > 1 ? computeUnionBounds(selectedAnnotations) : undefined;

  const computeUnionBounds = (annotations: I[]): Bounds => {
    let maxX = - Infinity;
    let maxY = - Infinity;
    let minX = Infinity;
    let minY = Infinity;

    for (let a of annotations.filter(i => isImageAnnotation(i))) {
      const { bounds } = a.target.selector.geometry;

      if (bounds.maxX > maxX) maxX = bounds.maxX;
      if (bounds.maxY > maxY) maxY = bounds.maxY;
      if (bounds.minX < minX) minX = bounds.minX;
      if (bounds.minY < minY) minY = bounds.minY;
    }

    viewer.forceRedraw();

    return { maxX, maxY, minX, minY };
  }
</script>

{#if Boolean(union)}
  <OSDLayer viewer={viewer} let:transform>
    <svg class="a9s-osd-selectionlayer">
      <g transform={transform}>
        <rect
          class="a9s-union-bg"
          x={union?.minX} 
          y={union?.minY} 
          width={union ? union.maxX - union.minX : 0} 
          height={union ? union.maxY - union.minY : 0} />

        <rect
          class="a9s-union-fg"
          x={union?.minX} 
          y={union?.minY} 
          width={union ? union.maxX - union.minX : 0} 
          height={union ? union.maxY - union.minY : 0} />

        {#each selectedAnnotations.filter(a => isImageAnnotation(a)) as a}
          {#if (a.target.selector.type === ShapeType.RECTANGLE)}
            <SelectedRectangle annotation={a} />
          {:else if (a.target.selector.type === ShapeType.POLYGON)}
            <SelectedPolygon annotation={a} />
          {:else if (a.target.selector.type === ShapeType.MULTIPOLYGLON)}
            <SelectedMultiPolygon annotation={a} />
          {:else if (a.target.selector.type === ShapeType.ELLIPSE)}
            <SelectedEllipse annotation={a} />
          {:else if (a.target.selector.type === ShapeType.LINE)}
            <SelectedLine annotation={a} />
          {/if}
        {/each}
      </g>
    </svg>
  </OSDLayer>
{/if}

<style>
  svg {
    overflow: visible;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    outline: none;
    pointer-events: none;
  }

  :global(.a9s-osd-selectionlayer :is(rect, path, polygon, ellipse, line)) {
    fill: rgba(49, 130, 237, 0.25);
    stroke: #3182ed;
    stroke-width: 1.5px;
    vector-effect: non-scaling-stroke;
  }

  rect.a9s-union-fg  {
    fill: rgba(49, 130, 237, 0.12);
    stroke-width: 1px;
  }

  rect.a9s-union-bg {
    fill: transparent;
    stroke: #fff;
    stroke-width: 2px;
  }
</style>