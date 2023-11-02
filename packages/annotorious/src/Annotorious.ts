import type { SvelteComponent } from 'svelte';
import type { Annotator, DrawingStyle, User } from '@annotorious/core';
import { createAnonymousGuest, createBaseAnnotator, createLifecyleObserver } from '@annotorious/core';
import { registerEditor } from './annotation/editors';
import { getTool, registerTool, type DrawingTool } from './annotation/tools';
import { SVGAnnotationLayer } from './annotation';
import type { SVGAnnotationLayerPointerEvent } from './annotation';
import type { ImageAnnotation, ShapeType } from './model';
import { createSvelteImageAnnotatorState } from './state';
import { setTheme } from './themes';
import { fillDefaults } from './AnnotoriousOpts';
import type { AnnotoriousOpts } from './AnnotoriousOpts';

import './Annotorious.css';
import './themes/dark/index.css';
import './themes/light/index.css';

export interface ImageAnnotator<E extends unknown = ImageAnnotation> extends Annotator<ImageAnnotation, E> { 

  registerDrawingTool(name: string, tool: typeof SvelteComponent): void;

  registerShapeEditor(shapeType: ShapeType, editor: typeof SvelteComponent): void;

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

  const state = createSvelteImageAnnotatorState(opts);

  const { hover, selection, store } = state;

  const lifecycle = createLifecyleObserver<ImageAnnotation, E>(
    store, selection, hover, undefined, opts.adapter, opts.autoSave);

  let _style = opts.style;

  let currentUser: User = opts.readOnly ? null : createAnonymousGuest();

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
    props: { image: img, state, style: _style }
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

  // Most of the external API functions are covered in the base annotator
  const base = createBaseAnnotator<ImageAnnotation, E>(store, opts.adapter);

  const setStyle = (style: DrawingStyle | ((annotation: ImageAnnotation) => DrawingStyle) | undefined) => {
    _style = style;
    annotationLayer.$set({ style });
  }

  const destroy = () => {
    // Destroy Svelte annotation layer
    annotationLayer.$destroy();

    // Unwrap the image
    container.parentNode.insertBefore(img, container);
    container.parentNode.removeChild(container);
  }

  const registerDrawingTool = (name: string, tool: typeof SvelteComponent) =>
    registerTool(name, tool);

  const registerShapeEditor = (shapeType: ShapeType, editor: typeof SvelteComponent) =>
    registerEditor(shapeType, editor);

  const getUser = () => currentUser;

  const setDrawingTool = (tool: DrawingTool) => {
    const t = getTool(tool) as typeof SvelteComponent;
    annotationLayer.$set({ tool: t })
  }

  const setSelected = (arg?: string | string[]) => {
    if (arg) {
      selection.setSelected(arg);
    } else {
      selection.clear();
    }
  }

  const setUser = (user: User) => {
    currentUser = user;
    // annotationLayer.$set({ user });
  }

  return {
    ...base,
    get style() { return _style },
    set style(s: DrawingStyle | ((annotation: ImageAnnotation) => DrawingStyle) | undefined) { setStyle(s) },
    destroy,
    getUser,
    on: lifecycle.on,
    off: lifecycle.off,
    registerDrawingTool,
    registerShapeEditor,
    setDrawingTool,
    setSelected,
    setUser,
    state
  }

}