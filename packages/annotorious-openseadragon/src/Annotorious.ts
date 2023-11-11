import type OpenSeadragon from 'openseadragon';
import type { SvelteComponent } from 'svelte';
import { createAnonymousGuest, createBaseAnnotator, createLifecyleObserver } from '@annotorious/core';
import type { Annotator, DrawingStyle, PresenceProvider, User } from '@annotorious/core/src';
import { fillDefaults, createImageAnnotatorState } from '@annotorious/annotorious/src';
import { listDrawingTools, getTool, registerTool, registerEditor } from '@annotorious/annotorious/src/annotation';
import type { AnnotoriousOpts, DrawingTool, ImageAnnotation, ShapeType } from '@annotorious/annotorious/src';
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

  listDrawingTools(): string[];

  registerDrawingTool(name: string, tool: typeof SvelteComponent): void;

  registerShapeEditor(shapeType: ShapeType, editor: typeof SvelteComponent): void;

  setDrawingTool(tool: DrawingTool): void;

  setDrawingEnabled(enabled: boolean): void;

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

  let currentUser: User = createAnonymousGuest();

  initKeyCommands(viewer.element, selection, store); 

  const displayLayer = new PixiLayer({
    target: viewer.element,
    props: { state, viewer, style: _style }
  });

  const presenceLayer = new SVGPresenceLayer({
    target: viewer.element.querySelector('.openseadragon-canvas'),
    props: { store, viewer, provider: null }
  });

  const drawingLayer = new SVGDrawingLayer({
    target: viewer.element.querySelector('.openseadragon-canvas'),
    props: { 
      drawingEnabled: opts.drawingEnabled,
      drawingMode: opts.drawingMode,
      state, 
      user: currentUser, 
      viewer
    }
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

  const registerDrawingTool = (name: string, tool: typeof SvelteComponent) =>
    registerTool(name, tool);

  const registerShapeEditor = (shapeType: ShapeType, editor: typeof SvelteComponent) =>
    registerEditor(shapeType, editor);

  const setDrawingTool = (tool: DrawingTool) => {
    const t = getTool(tool) as typeof SvelteComponent;
    drawingLayer.$set({ tool: t })
  }

  const setDrawingEnabled = (enabled: boolean) =>
    drawingLayer.$set({ drawingEnabled: enabled });

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

  return {
    ...base,
    get style() { return _style },
    set style(s: DrawingStyle | ((annotation: ImageAnnotation) => DrawingStyle) | undefined) { setStyle(s) },
    destroy,
    fitBounds,
    fitBoundsWithConstraints,
    getUser,
    listDrawingTools,
    on: lifecycle.on,
    off: lifecycle.off,
    registerDrawingTool,
    registerShapeEditor,
    setDrawingEnabled,
    setDrawingTool,
    setPresenceProvider,
    setSelected,
    setUser,
    state,
    viewer
  }

}
