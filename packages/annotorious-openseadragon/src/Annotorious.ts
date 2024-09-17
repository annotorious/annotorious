import type OpenSeadragon from 'openseadragon';
import type { SvelteComponent } from 'svelte';
import { 
  createAnonymousGuest, 
  createBaseAnnotator, 
  createLifecycleObserver,
  createUndoStack, 
  UserSelectAction
} from '@annotorious/core';
import type { 
  Annotation,
  Annotator, 
  DrawingStyleExpression, 
  Filter, 
  PresenceProvider, 
  User 
} from '@annotorious/core';
import { 
  createImageAnnotatorState, 
  fillDefaults, 
  getTool,
  initKeyboardCommands,
  isTouch,
  listDrawingTools,
  registerTool,
  registerEditor
} from '@annotorious/annotorious';
import type {
  AnnotoriousOpts, 
  DrawingTool, 
  DrawingToolOpts, 
  ImageAnnotation, 
  ShapeType, 
  Theme
} from '@annotorious/annotorious';
import type { PixiLayerClickEvent } from './annotation';
import { PixiLayer, SVGDrawingLayer, SVGPresenceLayer } from './annotation';
import { setTheme as _setTheme } from './themes';
import { 
  fitBounds as _fitBounds, 
  fitBoundsWithConstraints as _fitBoundsWithConstraints, 
  type FitboundsOptions 
} from './api';

import '@annotorious/annotorious/annotorious.css';

export interface OpenSeadragonAnnotator<I extends Annotation = ImageAnnotation, E extends unknown = ImageAnnotation> extends Annotator<I, E> {

  viewer: OpenSeadragon.Viewer;

  cancelDrawing(): void;

  getDrawingTool(): string | undefined;

  isDrawingEnabled(): boolean;

  fitBounds(arg: { id: string } | string, opts?: FitboundsOptions): void;

  fitBoundsWithConstraints(arg: { id: string } | string, opts?: FitboundsOptions): void;

  listDrawingTools(): string[];

  registerDrawingTool(name: string, tool: typeof SvelteComponent, opts?: DrawingToolOpts): void;

  registerShapeEditor(shapeType: ShapeType, editor: typeof SvelteComponent): void;

  setDrawingTool(name: DrawingTool): void;

  setDrawingEnabled(enabled: boolean): void;

  setTheme(theme: 'light' | 'dark' | 'auto'): void;

}

export const createOSDAnnotator = <I extends Annotation = ImageAnnotation, E extends unknown = ImageAnnotation>(
  viewer: OpenSeadragon.Viewer, 
  options: AnnotoriousOpts<I, E> = {}
): OpenSeadragonAnnotator<I, E> => {

  const opts = fillDefaults<I, E>(options, {
    drawingEnabled: false,
    drawingMode: isTouch ? 'drag' : 'click',
    userSelectAction: UserSelectAction.EDIT,
    theme: 'light'
  });

  const state = createImageAnnotatorState<I, E>(opts);

  const { hover, selection, store } = state;

  const undoStack = createUndoStack(store);

  const lifecycle = createLifecycleObserver<I, E>(
    state, undoStack, opts.adapter, opts.autoSave);

  let currentUser: User = createAnonymousGuest();

  let drawingEnabled = opts.drawingEnabled;

  let drawingMode = opts.drawingMode;

  const keyboardCommands = initKeyboardCommands(undoStack, viewer.element);

  const displayLayer = new PixiLayer({
    target: viewer.element,
    props: { 
      state, 
      viewer, 
      style: opts.style,
      filter: undefined
    }
  });

  const presenceLayer = new SVGPresenceLayer({
    target: viewer.element.querySelector('.openseadragon-canvas')!,
    props: { 
      provider: undefined,
      store,
      viewer
    }
  });

  const drawingLayer = new SVGDrawingLayer({
    target: viewer.element.querySelector('.openseadragon-canvas')!,
    props: { 
      drawingEnabled: Boolean(drawingEnabled),
      filter: undefined,
      preferredDrawingMode: drawingMode!,
      state,
      style: opts.style,
      user: currentUser, 
      viewer
    }
  });

  displayLayer.$on('click', (evt: CustomEvent<PixiLayerClickEvent>) => {    
    const { originalEvent, annotation } = evt.detail;

    // Ignore click event if drawing is currently active with mode 'click'
    const blockEvent = drawingMode === 'click' && drawingEnabled;
    if (annotation && !blockEvent)
      selection.userSelect(annotation.id, originalEvent);
    else if (!selection.isEmpty())
      selection.clear();
  });

  viewer.element.addEventListener('pointerdown', (event: PointerEvent) => {
    if (hover.current) {
      const hovered = store.getAnnotation(hover.current)!;
      lifecycle.emit('clickAnnotation', hovered, event);
    }
  });
  
  _setTheme(viewer, opts.theme!);

  /*************************/
  /*      External API     */
  /******++++++*************/

  // Most of the external API functions are covered in the base annotator
  const base = createBaseAnnotator<I, E>(state, undoStack, opts.adapter);

  const cancelDrawing = () => {
    drawingLayer.$set({ drawingEnabled: false });
    setTimeout(() => drawingLayer.$set({ drawingEnabled: true }), 1);
  }

  const destroy = () => {
    // Destroy Svelte layers
    displayLayer.$destroy();
    presenceLayer.$destroy();
    drawingLayer.$destroy();

    // Other cleanup actions
    keyboardCommands.destroy();
    undoStack.destroy();
  }

  const fitBounds = _fitBounds(viewer, store);

  const fitBoundsWithConstraints = _fitBoundsWithConstraints(viewer, store);

  const getDrawingTool = () =>
    drawingLayer.getDrawingTool();

  const getUser = () => currentUser;

  const isDrawingEnabled = () => 
    drawingLayer.isDrawingEnabled();

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
    drawingLayer.$set({ toolName: name });
  }

  const setDrawingEnabled = (enabled: boolean) => {
    drawingEnabled = enabled;
    drawingLayer.$set({ drawingEnabled });
  }

  const setFilter = (filter: Filter | undefined) => {
    // @ts-ignore
    displayLayer.$set({ filter });
    // @ts-ignore
    drawingLayer.$set({ filter });
  }

  const setStyle = (style: DrawingStyleExpression<I> | undefined) => {
    displayLayer.$set({ style: style as DrawingStyleExpression<ImageAnnotation> });
    drawingLayer.$set({ style: style as DrawingStyleExpression<ImageAnnotation> });
  }

  const setPresenceProvider = (provider: PresenceProvider) =>
    // @ts-ignore
    presenceLayer.$set({ provider });

  const setTheme = (theme: Theme) => _setTheme(viewer, theme);

  const setUser = (user: User) => {
    currentUser = user;
    drawingLayer.$set({ user });
  }

  const setVisible = (visible: boolean) =>
    // @ts-ignore
    displayLayer.$set({ visible });

  return {
    ...base,
    cancelDrawing,
    destroy,
    fitBounds,
    fitBoundsWithConstraints,
    getDrawingTool,
    getUser,
    isDrawingEnabled,
    listDrawingTools,
    on: lifecycle.on,
    off: lifecycle.off,
    registerDrawingTool,
    registerShapeEditor,
    setDrawingEnabled,
    setDrawingTool,
    setFilter,
    setPresenceProvider,
    setStyle,
    setTheme,
    setUser,
    setVisible,
    state,
    viewer
  }

}
