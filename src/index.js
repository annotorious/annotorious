import React from 'react';
import ReactDOM from 'react-dom';
import Emitter from 'tiny-emitter';
import axios from 'axios';
import { WebAnnotation, Selection, createEnvironment, addPolyfills, setLocale } from '@recogito/recogito-client-core';
import ImageAnnotator from './ImageAnnotator';

import '@babel/polyfill';
addPolyfills(); // Some extra polyfills that babel doesn't include

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

    // Host app may supply the image as either a DOM node or ID - normalize
    this._imageEl = (config.image.nodeType) ?
      config.image : document.getElementById(config.image);

    // Wrapper div might produce unwanted margin at the bottom otherwise!
    this._imageEl.style.display = 'block';

    // Store image reference in the Environment
    this._env = createEnvironment();
    this._env.image = this._imageEl;

    setLocale(config.locale);

    // We'll wrap the image in a DIV ('_wrapperEl'). The application
    // container DIV, which holds the editor popup, will be attached
    // as a child to the same wrapper element (=a sibling to the image
    // element), so that editor and image share the same offset coordinate
    // space.
    this._wrapperEl = document.createElement('DIV');
    this._wrapperEl.style.position = 'relative';
    this._wrapperEl.style.display = 'inline-block';
    this._imageEl.parentNode.insertBefore(this._wrapperEl, this._imageEl);
    this._wrapperEl.appendChild(this._imageEl);

    this._appContainerEl = document.createElement('DIV');
    this._wrapperEl.appendChild(this._appContainerEl);

    // A basic ImageAnnotator with just a comment and a tag widget
    ReactDOM.render(
      <ImageAnnotator
        ref={this._app}
        env={this._env}
        wrapperEl={this._wrapperEl}
        config={config}
        onSelectionCreated={this.handleSelectionCreated}
        onSelectionTargetChanged={this.handleSelectionTargetChanged}
        onAnnotationCreated={this.handleAnnotationCreated}
        onAnnotationSelected={this.handleAnnotationSelected}
        onAnnotationUpdated={this.handleAnnotationUpdated}
        onAnnotationDeleted={this.handleAnnotationDeleted}
        onMouseEnterAnnotation={this.handleMouseEnterAnnotation}
        onMouseLeaveAnnotation={this.handleMouseLeaveAnnotation} />, this._appContainerEl);
  }

  /********************/
  /*  External events */
  /********************/

  handleSelectionTargetChanged = target =>
    this._emitter.emit('changeSelectionTarget', target);

  handleAnnotationCreated = (annotation, overrideId) =>
    this._emitter.emit('createAnnotation', annotation.underlying, overrideId);

  handleSelectionCreated = selection =>
    this._emitter.emit('createSelection', selection._underlying);

  handleAnnotationDeleted = annotation =>
    this._emitter.emit('deleteAnnotation', annotation.underlying);

  handleMouseEnterAnnotation = (annotation, evt) =>
    this._emitter.emit('mouseEnterAnnotation', annotation.underlying, evt);

  handleMouseLeaveAnnotation = (annotation, evt) =>
    this._emitter.emit('mouseLeaveAnnotation', annotation.underlying, evt);

  handleAnnotationSelected = annotation =>
    this._emitter.emit('selectAnnotation', annotation.underlying);

  handleAnnotationUpdated = (annotation, previous) =>
    this._emitter.emit('updateAnnotation', annotation.underlying, previous.underlying);

  /******************/
  /*  External API  */
  /******************/

  addAnnotation = (annotation, readOnly) =>
    this._app.current.addAnnotation(new WebAnnotation(annotation, { readOnly }));

  // @deprecated
  applyTemplate = (template, openEditor) => {
    const bodies = Array.isArray(template) ? template : [ template ];
    this._app.current.applyTemplate(bodies, openEditor);
  }

  clearAuthInfo = () =>
    this._env.user = null;

  destroy = () => {
    ReactDOM.unmountComponentAtNode(this._appContainerEl);
    this._wrapperEl.parentNode.insertBefore(this._imageEl, this._wrapperEl);
    this._wrapperEl.parentNode.removeChild(this._wrapperEl);
  }

  getAnnotations = () => {
    const annotations = this._app.current.getAnnotations();
    return annotations.map(a => a.underlying);
  }

  getSelectedAnnotation = () => {
    const selected = this._app.current.getSelectedAnnotation();
    return selected?.underlying;
  }

  getSelectedImageSnippet = () =>
    this._app.current.getSelectedImageSnippet();

  loadAnnotations = url => axios.get(url).then(response => {
    const annotations = response.data.map(a => new WebAnnotation(a));
    this._app.current.setAnnotations(annotations);
    return annotations;
  });

  off = (event, callback) =>
    this._emitter.off(event, callback);

  on = (event, handler) =>
    this._emitter.on(event, handler);

  removeAnnotation = annotation =>
    this._app.current.removeAnnotation(new WebAnnotation(annotation));

  selectAnnotation = annotationOrId => {
    const arg = (annotationOrId?.type === 'Annotation') ?
      new WebAnnotation(annotationOrId) : annotationOrId;

    const selected = this._app.current.selectAnnotation(arg);
    return selected?.underlying;
  }

  setAnnotations = annotations => {
    const webannotations = annotations.map(a => new WebAnnotation(a));
    this._app.current.setAnnotations(webannotations);
  }

  setAuthInfo = authinfo =>
    this._env.user = authinfo;

  setDrawingTool = shape =>
    this._app.current.setDrawingTool(shape);

  setVisible = visible =>
    this._app.current.setVisible(visible);

  setServerTime = timestamp =>
    this._env.setServerTime(timestamp);

  updateSelected = annotation => {
    let updated = null;

    if (annotation.type === 'Annotation') {
      updated = new WebAnnotation(annotation);
    } else if (annotation.type === 'Selection') {
      updated = new Selection(annotation.target, annotation.body);
    }
    
    if (updated)
      this._app.current.updateSelected(updated);
  }

}

export const init = config => new Annotorious(config);

export * from './Formatting';
export * from './selectors';
export * from './tools';
