import type OpenSeadragon from 'openseadragon';
import type { SvelteComponent } from 'svelte';
import { createAnonymousGuest, createLifecyleObserver, Origin, parseAll  } from '@annotorious/core';
import type { Annotator, Formatter, PresenceProvider, User } from '@annotorious/core';
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

  const lifecycle = createLifecyleObserver(store, selection, hover, undefined, opts.adapter);

  initKeyCommands(viewer.element, selection, store); 

  let currentUser: User = opts.readOnly ? null : createAnonymousGuest();

  const displayLayer = new PixiLayer({
    target: viewer.element,
    props: { state, viewer, formatter: null }
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

  const addAnnotation = (annotation: E) => {
    if (opts.adapter) {
      const { parsed, error } = opts.adapter.parse(annotation);
      if (parsed) {
        store.addAnnotation(parsed, Origin.REMOTE);
      } else {
        console.error(error);
      }
    } else {
      store.addAnnotation(annotation as ImageAnnotation, Origin.REMOTE);
    }
  }

  const getAnnotations = () =>
    (opts.adapter ? store.all().map(opts.adapter.serialize) : store.all()) as E[];

  const fitBounds = _fitBounds(viewer, store);

  const fitBoundsWithConstraints = _fitBoundsWithConstraints(viewer, store);

  const getAnnotationById = (id: string): E | undefined => {
    const annotation = store.getAnnotation(id);
    return (opts.adapter && annotation) ?
      opts.adapter.serialize(annotation) as E : annotation as E | undefined;
  }

  const getUser = () => currentUser;

  const loadAnnotations = (url: string) =>
    fetch(url)
      .then((response) => response.json())
      .then((annotations) => {
        setAnnotations(annotations);
        return annotations;
      });

  const removeAnnotation = (arg: E | string): E => {
    if (typeof arg === 'string') {
      const annotation = store.getAnnotation(arg);
      store.deleteAnnotation(arg);

      return opts.adapter ? opts.adapter.serialize(annotation) : annotation as E;
    } else {
      const annotation = opts.adapter ? opts.adapter.parse(arg).parsed : (arg as ImageAnnotation);
      store.deleteAnnotation(annotation);
      return arg;
    }
  }

  const setAnnotations = (annotations: E[]) => {
    if (opts.adapter) {
      const { parsed, failed } = parseAll(opts.adapter)(annotations);

      if (failed.length > 0)
        console.warn(`Discarded ${failed.length} invalid annotations`, failed);

      store.bulkAddAnnotation(parsed, true, Origin.REMOTE);
    } else {
      store.bulkAddAnnotation(annotations as ImageAnnotation[], true, Origin.REMOTE);
    }
  }

  const setFormatter = (formatter: Formatter) =>
    displayLayer.$set({ formatter });

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

  const updateAnnotation = (updated: E): E => {
    if (opts.adapter) {
      const crosswalked = opts.adapter.parse(updated).parsed;
      const previous = opts.adapter.serialize(store.getAnnotation(crosswalked.id));
      store.updateAnnotation(crosswalked);
      return previous;
    } else {
      const previous = store.getAnnotation((updated as ImageAnnotation).id);
      store.updateAnnotation(updated as ImageAnnotation);
      return previous as E;
    }
  }

  return {
    addAnnotation,
    fitBounds,
    fitBoundsWithConstraints,
    getAnnotationById,
    getAnnotations,
    getUser,
    listTools,
    loadAnnotations,
    on: lifecycle.on,
    off: lifecycle.off,
    removeAnnotation,
    setAnnotations,
    setFormatter,
    setPresenceProvider,
    setSelected,
    setUser,
    startDrawing,
    state,
    stopDrawing,
    updateAnnotation,
    viewer
  }

}
