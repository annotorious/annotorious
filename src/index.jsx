import React from 'react';
import ReactDOM from 'react-dom';
import Emitter from 'tiny-emitter';
import ImageAnnotator from './ImageAnnotator';
import {
  Selection,
  WebAnnotation,
  createEnvironment,
  setLocale
} from '@recogito/recogito-client-core';

import '@recogito/recogito-client-core/themes/default';

/**
 * The entrypoint into the application. Provides the
 * externally visible JavaScript API.
 */
export class Annotorious {

  constructor(config) {
    // Programmatic calls to this instance from outside are forwarded
    // through a ref
    this._app = React.createRef();

    // Event handling via tiny-emitter
    this._emitter = new Emitter();

    // TODO .headless option is deprecated!
    config.disableEditor = config.disableEditor || config.headless;

    // Host app may supply the image as either a DOM node or ID - normalize
    const imageEl = (config.image.nodeType) ?
      config.image : document.getElementById(config.image);

    // Wrapper div might produce unwanted margin at the bottom otherwise!
    imageEl.style.display = 'block';

    // Store image reference in the Environment
    this._env = createEnvironment();
    this._env.image = imageEl;

    // Image coordinate mode to use
    this._env.relativeCoordinates = config.relativeCoordinates || false;

    setLocale(config.locale, config.messages);

    // We'll wrap the image in a DIV ('_element'). The application
    // container DIV, which holds the editor popup, will be attached
    // as a child to the same wrapper element (=a sibling to the image
    // element), so that editor and image share the same offset coordinate
    // space.
    this._element = document.createElement('DIV');
    this._element.style.position = 'relative';
    this._element.style.display = 'inline-block';

    imageEl.parentNode.insertBefore(this._element, imageEl);
    this._element.appendChild(imageEl);

    this._appContainerEl = document.createElement('DIV');
    this._element.appendChild(this._appContainerEl);

    // A basic ImageAnnotator with just a comment and a tag widget
    ReactDOM.render(
      <ImageAnnotator
        ref={this._app}
        env={this._env}
        wrapperEl={this._element}
        config={config}
        onSelectionStarted={this.handleSelectionStarted}
        onSelectionCreated={this.handleSelectionCreated}
        onSelectionTargetChanged={this.handleSelectionTargetChanged}
        onAnnotationCreated={this.handleAnnotationCreated}
        onAnnotationSelected={this.handleAnnotationSelected}
        onAnnotationUpdated={this.handleAnnotationUpdated}
        onAnnotationDeleted={this.handleAnnotationDeleted}
        onCancelSelected={this.handleCancelSelected}
        onClickAnnotation={this.handleClickAnnotation}
        onMouseEnterAnnotation={this.handleMouseEnterAnnotation}
        onMouseLeaveAnnotation={this.handleMouseLeaveAnnotation} />, this._appContainerEl);
  }

  /********************/
  /*  External events */
  /********************/

  handleAnnotationCreated = (annotation, overrideId) =>
    this._emitter.emit('createAnnotation', annotation.underlying, overrideId);

  handleAnnotationDeleted = annotation =>
    this._emitter.emit('deleteAnnotation', annotation.underlying);

  handleAnnotationSelected = (annotation, elem) =>
    this._emitter.emit('selectAnnotation', annotation.underlying, elem);

  handleAnnotationUpdated = (annotation, previous) =>
    this._emitter.emit('updateAnnotation', annotation.underlying, previous.underlying);

  handleCancelSelected = annotation =>
    this._emitter.emit('cancelSelected', annotation.underlying);

  handleClickAnnotation = (annotation, elem) =>
    this._emitter.emit('clickAnnotation', annotation.underlying, elem);

  handleSelectionCreated = selection =>
    this._emitter.emit('createSelection', selection.underlying);

  handleSelectionStarted = pt =>
    this._emitter.emit('startSelection', pt);

  handleSelectionTargetChanged = target =>
    this._emitter.emit('changeSelectionTarget', target);

  handleMouseEnterAnnotation = (annotation, elem) =>
    this._emitter.emit('mouseEnterAnnotation', annotation.underlying, elem);

  handleMouseLeaveAnnotation = (annotation, elem) =>
    this._emitter.emit('mouseLeaveAnnotation', annotation.underlying, elem);

  /******************/
  /*  External API  */
  /******************/

  // Common shorthand for handling annotationOrId args
  _wrap = annotationOrId =>
    annotationOrId?.type === 'Annotation' ? new WebAnnotation(annotationOrId) : annotationOrId;

  addAnnotation = (annotation, readOnly) =>
    this._app.current.addAnnotation(new WebAnnotation(annotation, { readOnly }));

  addDrawingTool = plugin =>
    this._app.current.addDrawingTool(plugin);

  cancelSelected = () =>
    this._app.current.cancelSelected();

  clearAnnotations = () =>
    this.setAnnotations([]);

  clearAuthInfo = () =>
    this._env.user = null;

  get disableEditor() {
    return this._app.current.disableEditor;
  }

  set disableEditor(disabled) {
    this._app.current.disableEditor = disabled;
  }

  get disableSelect() {
    return this._app.current.disableSelect;
  }

  set disableSelect(select) {
    this._app.current.disableSelect = select;
  }

  destroy = () => {
    ReactDOM.unmountComponentAtNode(this._appContainerEl);
    this._element.parentNode.insertBefore(this._env.image, this._element);
    this._element.parentNode.removeChild(this._element);
  }

  getAnnotations = () => {
    const annotations = this._app.current.getAnnotations();
    return annotations.map(a => a.underlying);
  }

  getSelected = () => {
    const selected = this._app.current.getSelected();
    return selected?.underlying;
  }

  getSelectedImageSnippet = () =>
    this._app.current.getSelectedImageSnippet();

  listDrawingTools = () =>
    this._app.current.listDrawingTools();

  loadAnnotations = url => fetch(url)
    .then(response => response.json()).then(annotations => {
      this.setAnnotations(annotations);
      return annotations;
    });

  off = (event, callback) =>
    this._emitter.off(event, callback);

  on = (event, handler) =>
    this._emitter.on(event, handler);

  once = (event, handler) =>
    this._emitter.once(event, handler);

  get readOnly() {
    return this._app.current.readOnly;
  }

  set readOnly(readOnly) {
    this._app.current.readOnly = readOnly;
  }

  removeAnnotation = annotationOrId =>
    this._app.current.removeAnnotation(this._wrap(annotationOrId));

  saveSelected = () =>
    this._app.current.saveSelected();

  selectAnnotation = annotationOrId => {
    const selected = this._app.current.selectAnnotation(this._wrap(annotationOrId));
    return selected?.underlying;
  }

  setAnnotations = a => {
    const annotations = a || []; // Allow null arg
    const webannotations = annotations.map(a => new WebAnnotation(a));
    this._app.current.setAnnotations(webannotations);
  }

  setAuthInfo = authinfo =>
    this._env.user = authinfo;

  setDrawingTool = shape =>
    this._app.current.setDrawingTool(shape);

  setServerTime = timestamp =>
    this._env.setServerTime(timestamp);

  setVisible = visible =>
    this._app.current.setVisible(visible);

  updateSelected = (annotation, saveImmediately) => {
    let updated = null;

    if (annotation.type === 'Annotation')
      updated = new WebAnnotation(annotation);
    else if (annotation.type === 'Selection')
      updated = new Selection(annotation.target, annotation.body);

    if (updated)
      this._app.current.updateSelected(updated, saveImmediately);
  }

  get widgets() {
    return this._app.current.widgets;
  }

  set widgets(widgets) {
    this._app.current.widgets = widgets;
  }

}

export const init = config => new Annotorious(config);
