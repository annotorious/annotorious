import React from 'react';
import ReactDOM from 'react-dom';
import Emitter from 'tiny-emitter';
import axios from 'axios';
import { WebAnnotation, Editor, Environment, addPolyfills, setLocale } from '@recogito/recogito-client-core';
import ImageAnnotator from './ImageAnnotator';

import "@babel/polyfill";
addPolyfills(); // Extra polyfills that babel doesn't include

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

    // The image is wrapped in a DIV ('wrapperEl'). The application
    // container DIV, which holds the editor popup, will be attached
    // as a child to the wrapper element (=a sibling to the image
    // element).
    this._imageEl = (config.image.nodeType) ?
      config.image : document.getElementById(config.image);

    // DIV will have unwanted margin at the bottom otherwise!
    this._imageEl.style.display = 'block';

    // Store image reference in the Environment
    Environment.image = this._imageEl;

    setLocale(config.locale);

    this._wrapperEl = document.createElement('DIV');
    this._wrapperEl.style.position = 'relative';
    this._wrapperEl.style.display = 'inline-block';
    this._imageEl.parentNode.insertBefore(this._wrapperEl, this._imageEl);
    this._wrapperEl.appendChild(this._imageEl);

    this._appContainerEl = document.createElement('DIV');
    this._wrapperEl.appendChild(this._appContainerEl);

    const { CommentWidget, TagWidget } = Editor;

    // A basic ImageAnnotator with just a comment and a tag widget
    ReactDOM.render(
      <ImageAnnotator
        ref={this._app}
        imageEl={this._imageEl}
        wrapperEl={this._wrapperEl}
        readOnly={config.readOnly}
        headless={config.headless}
        onSelectionCreated={this.handleSelectionCreated}
        onSelectionTargetChanged={this.handleSelectionTargetChanged}
        onAnnotationCreated={this.handleAnnotationCreated}
        onAnnotationSelected={this.handleAnnotationSelected}
        onAnnotationUpdated={this.handleAnnotationUpdated}
        onAnnotationDeleted={this.handleAnnotationDeleted}
        onMouseEnterAnnotation={this.handleMouseEnterAnnotation}
        onMouseLeaveAnnotation={this.handleMouseLeaveAnnotation}>

        <CommentWidget />
        <TagWidget vocabulary={config.tagVocabulary} />

      </ImageAnnotator>,

    this._appContainerEl);
  }

  /********************/
  /*  External events */
  /********************/

  handleSelectionTargetChanged = target =>
    this._emitter.emit('changeSelectionTarget', target);

  handleAnnotationCreated = annotation =>
    this._emitter.emit('createAnnotation', annotation.underlying);

  handleSelectionCreated = selection =>
    this._emitter.emit('createSelection', selection._stub);

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
    Environment.user = null;

  destroy = () => {
    ReactDOM.unmountComponentAtNode(this._appContainerEl);
    this._wrapperEl.parentNode.insertBefore(this._imageEl, this._wrapperEl);
    this._wrapperEl.parentNode.removeChild(this._wrapperEl);
  }

  getAnnotations = () => {
    const annotations = this._app.current.getAnnotations();
    return annotations.map(a => a.underlying);
  }

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
    Environment.user = authinfo;

  setDrawingTool = shape =>
    this._app.current.setDrawingTool(shape);

  setVisible = visible =>
    this._app.current.setVisible(visible);

  setServerTime = timestamp =>
    Environment.setServerTime(timestamp);

}

export const init = config => new Annotorious(config);

export * from './annotations';
export * from './tools';
