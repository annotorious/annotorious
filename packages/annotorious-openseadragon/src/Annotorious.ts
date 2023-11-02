import type OpenSeadragon from 'openseadragon';
import type { SvelteComponent } from 'svelte';
import { createAnonymousGuest, createBaseAnnotator, createLifecyleObserver } from '@annotorious/core';
import type { Annotator, DrawingStyle, PresenceProvider, User } from '@annotorious/core';
import { fillDefaults, listTools, getTool, createImageAnnotatorState } from '@annotorious/annotorious/src';
import type { AnnotoriousOpts, ImageAnnotation } from '@annotorious/annotorious/src';
import type { PixiLayerClickEvent } from './annotation';
import { PixiLayer, SVGDrawingLayer, SVGPresenceLayer } from './annotation';
import { initKeyCommands } from './keyCommands';
import { setTheme } from './themes/setTheme';
import { 
  fitBounds as _fitBounds, 
  fitBoundsWithConstraints as _fitBoundsWithConstraints, 
  type FitboundsOptions 
} from './api';

import '@annotorious/annotorious/annotorious.css';

export interface OpenSeadragonAnnotator<E extends unknown = ImageAnnotation> extends Annotator<ImageAnnotation, E> {

  viewer: OpenSeadragon.Viewer;

  fitBounds(arg: { id: string } | string, opts?: FitboundsOptions): void;

  fitBoundsWithConstraints(arg: { id: string } | string, opts?: FitboundsOptions): void;

  listTools(): string[];

  startDrawing(tool: string, keepEnabled?: boolean): void;

  stopDrawing(): void;

}

export const createOSDAnnotator = <E extends unknown = ImageAnnotation>(
  viewer: OpenSeadragon.Viewer, 
  options: AnnotoriousOpts<ImageAnnotation, E> = {}
): OpenSeadragonAnnotator<E> => {

  const opts = fillDefaults(options);

  const state = createImageAnnotatorState(opts);

  const { hover, selection, store } = state;

  const lifecycle = createLifecyleObserver(
    store, selection, hover, undefined, opts.adapter, opts.autoSave);

  let _style = opts.style;

  let currentUser: User = opts.readOnly ? null : createAnonymousGuest();

  initKeyCommands(viewer.element, selection, store); 

  const displayLayer = new PixiLayer({
    target: viewer.element,
    props: { state, viewer, style: null }
  });

  const presenceLayer = new SVGPresenceLayer({
    target: viewer.element.querySelector('.openseadragon-canvas'),
    props: { store, viewer, provider: null }
  });

  const drawingLayer = new SVGDrawingLayer({
    target: viewer.element.querySelector('.openseadragon-canvas'),
    props: { state, viewer, user: currentUser }
  });

  displayLayer.$on('click', (evt: CustomEvent<PixiLayerClickEvent>) => {
    const { originalEvent, annotation } = evt.detail;
    if (annotation)
      selection.clickSelect(annotation.id, originalEvent);
    else if (!selection.isEmpty())
      selection.clear();
  });

  viewer.element.addEventListener('pointerdown', (event: PointerEvent) => {
    if (hover.current) {
      const hovered = store.getAnnotation(hover.current);
      lifecycle.emit('clickAnnotation', hovered, event);
    }
  });
  
  setTheme(viewer);

  /*************************/
  /*      External API     */
  /******++++++*************/

  // Most of the external API functions are covered in the base annotator
  const base = createBaseAnnotator<ImageAnnotation, E>(store, opts.adapter);

  const setStyle = (style: DrawingStyle | ((annotation: ImageAnnotation) => DrawingStyle) | undefined) => {
    _style = style;
    displayLayer.$set({ style });
  }

  const destroy = () => {
    // Destroy Svelte layers
    displayLayer.$destroy();
    presenceLayer.$destroy();
    drawingLayer.$destroy();
  }

  const fitBounds = _fitBounds(viewer, store);

  const fitBoundsWithConstraints = _fitBoundsWithConstraints(viewer, store);

  const getUser = () => currentUser;

  const setSelected = (arg?: string | string[]) => {
    if (arg) {
      selection.setSelected(arg);
    } else {
      selection.clear();
    }
  }

  const setPresenceProvider = (provider: PresenceProvider) =>
    presenceLayer.$set({ provider });

  const setUser = (user: User) => {
    currentUser = user;
    drawingLayer.$set({ user });
  }

  const startDrawing = (tool: string, keepEnabled: boolean = false) => {
    const t = getTool(tool) as typeof SvelteComponent;
    //@ts-ignore
    drawingLayer.$set({ tool: t, keepEnabled })
  }

  const stopDrawing = () => {
    //@ts-ignore
    drawingLayer.$set({ tool: null });
  }

  return {
    ...base,
    get style() { return _style },
    set style(s: DrawingStyle | ((annotation: ImageAnnotation) => DrawingStyle) | undefined) { setStyle(s) },
    destroy,
    fitBounds,
    fitBoundsWithConstraints,
    getUser,
    listTools,
    on: lifecycle.on,
    off: lifecycle.off,
    setPresenceProvider,
    setSelected,
    setUser,
    startDrawing,
    state,
    stopDrawing,
    viewer
  }

}
