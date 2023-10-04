import type { SvelteComponent } from 'svelte';
import type { Annotator, Formatter, User } from '@annotorious/core';
import { createAnonymousGuest, createLifecyleObserver, Origin, parseAll } from '@annotorious/core';
import { SVGAnnotationLayer } from './annotation';
import { getTool, type DrawingTool } from './annotation/tools';
import type { SVGAnnotationLayerPointerEvent } from './annotation';
import type { ImageAnnotation } from './model';
import { createSvelteImageAnnotatorState } from './state';
import { setTheme } from './themes';
import { fillDefaults } from './AnnotoriousOpts';
import type { AnnotoriousOpts } from './AnnotoriousOpts';

import './Annotorious.css';
import './themes/dark/index.css';
import './themes/light/index.css';

export interface ImageAnnotator<E extends unknown = ImageAnnotation> extends Annotator<ImageAnnotation, E> { 

  setDrawingTool(tool: DrawingTool): void; 

}

export const createImageAnnotator = <E extends unknown = ImageAnnotation>(
  image: string | HTMLImageElement | HTMLCanvasElement, 
  options: AnnotoriousOpts<ImageAnnotation, E> = {}
): ImageAnnotator<E> => {

  if (!image)
    throw 'Missing argument: image';

  const img = (typeof image === 'string' ? 
    document.getElementById(image) : image) as HTMLImageElement | HTMLCanvasElement;

  const opts = fillDefaults<ImageAnnotation, E>(options);

  let currentUser: User = opts.readOnly ? null : createAnonymousGuest();

  const state = createSvelteImageAnnotatorState(opts);

  const { hover, selection, store } = state;

  const lifecycle = createLifecyleObserver<ImageAnnotation, E>(
    store, selection, hover, undefined, opts.adapter);

  // We'll wrap the image in a container DIV.
  const container = document.createElement('DIV');
  container.style.position = 'relative';
  container.style.display = 'inline-block';

  // Wrapper div has unwanted margin at the bottom otherwise!
  img.style.display = 'block';

  img.parentNode.insertBefore(container, img);
  container.appendChild(img);

  setTheme(img, container);

  const annotationLayer = new SVGAnnotationLayer({
    target: container,
    props: { image: img, state }
  });

  annotationLayer.$on('click', (evt: CustomEvent<SVGAnnotationLayerPointerEvent>) => {
    const { originalEvent, annotation } = evt.detail;
    if (annotation)
      selection.clickSelect(annotation.id, originalEvent);
    else if (!selection.isEmpty())
      selection.clear();
  });

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

  const getAnnotationById = (id: string): E | undefined => {
    const annotation = store.getAnnotation(id);
    return (opts.adapter && annotation) ?
      opts.adapter.serialize(annotation) as E : annotation as E | undefined;
  }

  const getAnnotations = () =>
    (opts.adapter ? store.all().map(opts.adapter.serialize) : store.all()) as E[];

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

  const setDrawingTool = (tool: DrawingTool) => {
    const t = getTool(tool) as typeof SvelteComponent;
    annotationLayer.$set({ tool: t })
  }

  const setFormatter = (formatter: Formatter) => {
    // TODO
  }

  const setUser = (user: User) => {
    currentUser = user;
    // annotationLayer.$set({ user });
  }

  return {
    addAnnotation,
    getAnnotationById,
    getAnnotations,
    getUser,
    loadAnnotations,
    removeAnnotation,
    on: lifecycle.on,
    off: lifecycle.off,
    setAnnotations,
    setDrawingTool,
    setFormatter, 
    setUser,
    state
  }

}