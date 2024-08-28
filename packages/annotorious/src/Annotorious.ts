import type { SvelteComponent } from 'svelte';
import { UserSelectAction } from '@annotorious/core';
import type { Annotation, Annotator, DrawingStyleExpression, Filter, User } from '@annotorious/core';
import { createAnonymousGuest, createBaseAnnotator, createLifecycleObserver, createUndoStack } from '@annotorious/core';
import { registerEditor } from './annotation/editors';
import { getTool, registerTool, listDrawingTools, type DrawingTool } from './annotation/tools';
import { SVGAnnotationLayer } from './annotation';
import type { DrawingToolOpts, SVGAnnotationLayerPointerEvent } from './annotation';
import type { ImageAnnotation, ShapeType } from './model';
import { createSvelteImageAnnotatorState } from './state';
import { setTheme as _setTheme } from './themes';
import { fillDefaults, type Theme } from './AnnotoriousOpts';
import type { AnnotoriousOpts } from './AnnotoriousOpts';
import { initKeyboardCommands } from './keyboardCommands';

import './Annotorious.css';
import './themes/dark/index.css';
import './themes/light/index.css';

export interface ImageAnnotator<I extends Annotation = ImageAnnotation, E extends unknown = ImageAnnotation> extends Annotator<I, E> { 

  element: HTMLDivElement;

  listDrawingTools(): string[];

  registerDrawingTool(name: string, tool: typeof SvelteComponent, opts?: DrawingToolOpts): void;

  registerShapeEditor(shapeType: ShapeType, editor: typeof SvelteComponent): void;

  setDrawingTool(name: DrawingTool): void; 

  setDrawingEnabled(enabled: boolean): void;

  setTheme(theme: Theme): void;

}

export const createImageAnnotator = <I extends Annotation = ImageAnnotation, E extends unknown = ImageAnnotation>(
  image: string | HTMLImageElement | HTMLCanvasElement, 
  options: AnnotoriousOpts<I, E> = {}
): ImageAnnotator<I, E> => {

  if (!image)
    throw 'Missing argument: image';

  const img = (
    typeof image === 'string' ? document.getElementById(image) : image
  ) as HTMLImageElement | HTMLCanvasElement;

  const opts = fillDefaults<I, E>(options, {
    drawingEnabled: true,
    drawingMode: 'drag',
    userSelectAction: UserSelectAction.EDIT,
    theme: 'light'
  });

  const state = createSvelteImageAnnotatorState<I, E>(opts);

  const { selection, store } = state;

  const undoStack = createUndoStack(store);

  const lifecycle = createLifecycleObserver<I, E>(
    state, undoStack, opts.adapter, opts.autoSave
  );

  // We'll wrap the image in a container DIV.
  const container = document.createElement('DIV') as HTMLDivElement;
  container.style.position = 'relative';
  container.style.display = 'inline-block';

  // Wrapper div has unwanted margin at the bottom otherwise!
  img.style.display = 'block';

  img.parentNode!.insertBefore(container, img);
  container.appendChild(img);

  const keyboardCommands = initKeyboardCommands(undoStack);

  let currentUser: User = createAnonymousGuest();

  _setTheme(img, container, opts.theme!);

  const annotationLayer = new SVGAnnotationLayer({
    target: container,
    props: { 
      drawingEnabled: Boolean(opts.drawingEnabled), 
      image: img, 
      preferredDrawingMode: opts.drawingMode!,
      state: state, 
      style: opts.style, 
      user: currentUser
    }
  });

  annotationLayer.$on('click', (evt: CustomEvent<SVGAnnotationLayerPointerEvent<I>>) => {
    const { originalEvent, annotation } = evt.detail;
    if (annotation)
      selection.userSelect(annotation.id, originalEvent);
    else if (!selection.isEmpty())
      selection.clear();
  });

  /*************************/
  /*      External API     */
  /******++++++*************/

  // Most of the external API functions are covered in the base annotator
  const base = createBaseAnnotator<I, E>(state, undoStack, opts.adapter);

  const destroy = () => {
    // Destroy Svelte annotation layer
    annotationLayer.$destroy();

    // Unwrap the image
    container.parentNode!.insertBefore(img, container);
    container.parentNode!.removeChild(container);

    // Other cleanup actions
    keyboardCommands.destroy();
    undoStack.destroy();
  }

  const getUser = () => currentUser;

  const registerDrawingTool = (name: string, tool: typeof SvelteComponent, opts?: DrawingToolOpts) =>
    registerTool(name, tool, opts);

  const registerShapeEditor = (shapeType: ShapeType, editor: typeof SvelteComponent) =>
    registerEditor(shapeType, editor);

  const setDrawingTool = (name: DrawingTool) => {
    // Validate that the tool exists
    const toolSpec = getTool(name);
    if (!toolSpec)
      throw `No drawing tool named ${name}`;

    // @ts-ignore
    annotationLayer.$set({ toolName: name })
  }

  const setDrawingEnabled = (enabled: boolean) =>
    annotationLayer.$set({ drawingEnabled: enabled });
  
  const setFilter = (_: Filter) => {
    console.warn('Filter not implemented yet');
  }

  const setStyle = (style: DrawingStyleExpression<I> | undefined) =>
    annotationLayer.$set({ style: style as DrawingStyleExpression<ImageAnnotation> });

  const setTheme = (theme: Theme) => _setTheme(img, container, theme);
  
  const setUser = (user: User) => {
    currentUser = user;
    annotationLayer.$set({ user });
  }

  const setVisible = (visible: boolean) =>
    // @ts-ignore
    annotationLayer.$set({ visible });

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
    setStyle,
    setTheme,
    setUser,
    setVisible,
    element: container,
    state
  }

}
