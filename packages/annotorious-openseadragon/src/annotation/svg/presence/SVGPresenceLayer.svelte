<script type="ts">
  import { onDestroy } from 'svelte';
  import type { PresenceProvider, PresentUser, StoreChangeEvent } from '@annotorious/core';
  import { ShapeType, type ImageAnnotation, type ImageAnnotationStore } from '@annotorious/annotorious';
  import OSDLayer from '../OSDLayer.svelte';
  import SVGPresencePolygon from './shapes/PresencePolygon.svelte';
  import SVGPresenceRectangle from './shapes/PresenceRectangle.svelte';

  interface TrackedAnnotation {

    annotation: ImageAnnotation;

    selectedBy: PresentUser;

  }

  export let store: ImageAnnotationStore;
  
  export let viewer: OpenSeadragon.Viewer;

  export let provider: PresenceProvider = null;

  let trackedAnnotations: TrackedAnnotation[] = [];

  let storeObserver = null;

  $: if (provider) provider.on('selectionChange', onSelectionChange);

  const onSelectionChange = (p: PresentUser, selection: string[] | null) => {
    trackedAnnotations = [
      ...trackedAnnotations
        .filter(({ selectedBy }) => selectedBy.presenceKey !== p.presenceKey),
      ...(selection || []).map(id => ({ 
          // Warning - could be undefined!
          annotation: store.getAnnotation(id),
          selectedBy: p
        }))
    ].filter(({ annotation }) => {
      if (!annotation)
        console.warn('Selection event on unknown annotation');

      return Boolean(annotation);
    });
    
    // Track selection state in the store
    if (storeObserver)
      store.unobserve(storeObserver);

    storeObserver = (event: StoreChangeEvent<ImageAnnotation>) => {      
      const { deleted, updated } = event.changes;

      const deletedIds = new Set(deleted.map(a => a.id));

      const next: TrackedAnnotation[] = trackedAnnotations
        // Remove deleted
        .filter(({ annotation }) => !deletedIds.has(annotation.id))
        // Replace updated
        .map(tracked => {
          const u = updated.find(update => update.oldValue.id === tracked.annotation.id);
          if (u) {
            return { selectedBy: tracked.selectedBy, annotation: u.newValue }; 
          } else {
            return tracked; 
          }
        });

      trackedAnnotations = next;
    }

    store.observe(storeObserver, { 
      annotations: trackedAnnotations.map(t => t.annotation.id)
    });
  }

  onDestroy(() => {
    if (storeObserver)
      store.unobserve(storeObserver);
  });
</script>

{#if Boolean(provider)}
  <OSDLayer
    viewer={viewer}
    let:transform
    let:scale>
    <svg 
      class="a9s-osd-presencelayer">
      <g transform={transform}>
        {#if trackedAnnotations.length > 0}
          {#each trackedAnnotations as tracked}
            {#if (tracked.annotation.target.selector.type === ShapeType.RECTANGLE)}
              <SVGPresenceRectangle
                annotation={tracked.annotation} 
                user={tracked.selectedBy}
                scale={scale} />
            {:else if (tracked.annotation.target.selector.type === ShapeType.POLYGON)}
              <SVGPresencePolygon
                annotation={tracked.annotation} 
                user={tracked.selectedBy}
                scale={scale} />
            {/if}
          {/each}
        {/if}
      </g>
    </svg>
  </OSDLayer>
{/if}

<style>
  svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    outline: none;
    pointer-events: none;
  }
</style>
