import type { SvelteComponent } from 'svelte';
import type { Annotator, DrawingStyle, Filter, User } from '@annotorious/core';
import { createAnonymousGuest, createBaseAnnotator, createLifecyleObserver, createUndoStack } from '@annotorious/core';
import { registerEditor } from './annotation/editors';
import { getTool, registerTool, listDrawingTools, type DrawingTool } from './annotation/tools';
import { SVGAnnotationLayer } from './annotation';
import type { DrawingToolOpts, SVGAnnotationLayerPointerEvent } from './annotation';
import type { ImageAnnotation, ShapeType } from './model';
import { createSvelteImageAnnotatorState } from './state';
import { setTheme } from './themes';
import { fillDefaults } from './AnnotoriousOpts';
import type { AnnotoriousOpts } from './AnnotoriousOpts';
import { initKeyboardCommands } from './keyboardCommands';

import './Annotorious.css';
import './themes/dark/index.css';
import './themes/light/index.css';

export interface ImageAnnotator<E extends unknown = ImageAnnotation> extends Annotator<ImageAnnotation, E> { 

  listDrawingTools(): string[];

  registerDrawingTool(name: string, tool: typeof SvelteComponent, opts?: DrawingToolOpts): void;

  registerShapeEditor(shapeType: ShapeType, editor: typeof SvelteComponent): void;

  setDrawingTool(tool: DrawingTool): void; 

  setDrawingEnabled(enabled: boolean): void;

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

  const undoStack = createUndoStack(store);

  // We'll wrap the image in a container DIV.
  const container = document.createElement('DIV');
  container.style.position = 'relative';
  container.style.display = 'inline-block';

  // Wrapper div has unwanted margin at the bottom otherwise!
  img.style.display = 'block';

  img.parentNode.insertBefore(container, img);
  container.appendChild(img);

  const keyboardCommands = initKeyboardCommands(undoStack);

  let currentUser: User = createAnonymousGuest();

  setTheme(img, container);

  const annotationLayer = new SVGAnnotationLayer({
    target: container,
    props: { 
      drawingEnabled: opts.drawingEnabled, 
      image: img, 
      preferredDrawingMode: opts.drawingMode,
      state, 
      style: opts.style, 
      user: currentUser
    }
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
  const base = createBaseAnnotator<ImageAnnotation, E>(store, undoStack, opts.adapter);

  const destroy = () => {
    // Destroy Svelte annotation layer
    annotationLayer.$destroy();

    // Unwrap the image
    container.parentNode.insertBefore(img, container);
    container.parentNode.removeChild(container);

    // Other cleanup actions
    keyboardCommands.destroy();
    undoStack.destroy();
  }

  const getUser = () => currentUser;

  const registerDrawingTool = (name: string, tool: typeof SvelteComponent, opts?: DrawingToolOpts) =>
    registerTool(name, tool, opts);

  const registerShapeEditor = (shapeType: ShapeType, editor: typeof SvelteComponent) =>
    registerEditor(shapeType, editor);

  const setDrawingTool = (t: DrawingTool) => {
    const { tool, opts } = getTool(t);
    // @ts-ignore
    annotationLayer.$set({ tool, opts })
  }

  const setDrawingEnabled = (enabled: boolean) =>
    annotationLayer.$set({ drawingEnabled: enabled });
  
  const setFilter = (filter: Filter) => {
    console.warn('Filter not implemented yet');
  }

  const setSelected = (arg?: string | string[]) => {
    if (arg) {
      selection.setSelected(arg);
    } else {
      selection.clear();
    }
  }

  const setStyle = (style: DrawingStyle | ((annotation: ImageAnnotation) => DrawingStyle) | undefined) =>
    annotationLayer.$set({ style });

  const setUser = (user: User) => {
    currentUser = user;
    annotationLayer.$set({ user });
  }

  return {
    ...base,
    destroy,
    getUser,
    listDrawingTools,
    on: lifecycle.on,
    off: lifecycle.off,
    registerDrawingTool,
    registerShapeEditor,
    setDrawingEnabled,
    setDrawingTool,
    setFilter,
    setSelected,
    setStyle,
    setUser,
    state
  }

}