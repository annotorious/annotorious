import { mount, unmount, type Component } from 'svelte';
import { UserSelectAction } from '@annotorious/core';
import type { Annotation, Annotator, DrawingStyleExpression, Filter, User } from '@annotorious/core';
import { createAnonymousGuest, createBaseAnnotator, createLifecycleObserver, createUndoStack } from '@annotorious/core';
import { getTool, type DrawingTool } from './annotation/tools';
import { SVGAnnotationLayer } from './annotation';
import type { SVGAnnotationLayerPointerEvent } from './annotation';
import type { ImageAnnotation } from './model';
import { createSvelteImageAnnotatorState } from './state';
import { setTheme as _setTheme } from './themes';
import { fillDefaults, type Theme } from './AnnotoriousOpts';
import type { AnnotoriousOpts } from './AnnotoriousOpts';
import { initKeyboardCommands } from './keyboardCommands';

import './Annotorious.css';
import './themes/dark/index.css';
import './themes/light/index.css';
import type { SVGLayerProps } from './annotation/types';

export interface ImageAnnotator<I extends Annotation = ImageAnnotation, E extends unknown = ImageAnnotation> extends Annotator<I, E> { 

  element: HTMLDivElement;

  cancelDrawing(): void;

  getDrawingTool(): string | undefined;

  isDrawingEnabled(): boolean;

  // listDrawingTools(): string[];

  // registerDrawingTool(name: string, tool: Component, opts?: DrawingToolOpts): void;

  // registerShapeEditor(shapeType: ShapeType, editor: Component): void;

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

  let currentUser: User = $state(createAnonymousGuest());

  _setTheme(img, container, opts.theme!);

  const layerProps : SVGLayerProps<I, E> = $state(
    {
      drawingEnabled: Boolean(opts.drawingEnabled),
      image: img,
      preferredDrawingMode: opts.drawingMode!,
      state: state,
      style: opts.style,
      user: currentUser,
      toolName: undefined,
      onclick:  (evt: CustomEvent<SVGAnnotationLayerPointerEvent<I>>) => {
        const { originalEvent, annotation } = evt.detail;
        if (annotation)
          selection.userSelect(annotation.id, originalEvent);
        else if (!selection.isEmpty())
          selection.clear();
      },
      imageAnnotatorState: state
    }
  )
  const annotationLayer = mount(
    SVGAnnotationLayer<I, E>,
    { 
      target: container,
      props: layerProps
    }
  )

  /*************************/
  /*      External API     */
  /******++++++*************/

  // Most of the external API functions are covered in the base annotator
  const base = createBaseAnnotator<I, E>(state, undoStack, opts.adapter);

  const cancelDrawing = () => {
    layerProps.drawingEnabled = false;
    // TODO: I don't undrstand this.
    setTimeout(() => layerProps.drawingEnabled = true , 1);
  }

  const destroy = () => {
    // Destroy Svelte annotation layer
    unmount(annotationLayer)

    // Unwrap the image
    container.parentNode!.insertBefore(img, container);
    container.parentNode!.removeChild(container);

    // Other cleanup actions
    keyboardCommands.destroy();
    undoStack.destroy();
  }

  const getDrawingTool = () =>
    annotationLayer.getDrawingTool();

  const getUser = () => currentUser;

  const isDrawingEnabled = () => 
    layerProps.drawingEnabled;

  // const registerDrawingTool = (name: string, tool: Component, opts?: DrawingToolOpts) =>
  //   registerTool(name, tool, opts);

  // const registerShapeEditor = (shapeType: ShapeType, editor: Component) =>
  //   editors[shapeType] = editor;

  const setDrawingTool = (name: DrawingTool) => {
    // Validate that the tool exists
    const toolSpec = getTool(name);
    if (!toolSpec)
      throw `No drawing tool named ${name}`;

    layerProps.toolName =  name
  }

  const setDrawingEnabled = (enabled: boolean) =>
    layerProps.drawingEnabled = enabled;
  
  const setFilter = (_: Filter) => {
    console.warn('Filter not implemented yet');
  }

  const setStyle = (style: DrawingStyleExpression<I> | undefined) =>
    layerProps.style = style as DrawingStyleExpression<ImageAnnotation>;

  const setTheme = (theme: Theme) => _setTheme(img, container, theme);
  
  const setUser = (user: User) => {
    currentUser = user;
    layerProps.user = user;
  }

  const setVisible = (visible: boolean) =>
    // @ts-ignore
  layerProps.visible = visible;

  return {
    ...base,
    cancelDrawing,
    destroy,
    getDrawingTool,
    getUser,
    isDrawingEnabled,
    // listDrawingTools,
    on: lifecycle.on,
    off: lifecycle.off,
    // registerDrawingTool,
    // registerShapeEditor,
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
