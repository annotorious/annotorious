import React from 'react';
import ReactDOM from 'react-dom';
import Emitter from 'tiny-emitter';
import axios from 'axios';
import { WebAnnotation, Editor, Environment, addPolyfills } from '@recogito/recogito-client-core'; 
import ImageAnnotator from './ImageAnnotator';

addPolyfills(); // For Microsoft Edge

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
    const imageEl = (config.image.nodeType) ? 
      config.image : document.getElementById(config.image);

    // DIV will have unwanted margin at the bottom otherwise!
    imageEl.style.display = 'block';

    // Store image reference in the Environment
    Environment.image = imageEl;

    const wrapperEl = document.createElement('DIV');
    wrapperEl.style.position = 'relative';
    wrapperEl.style.display = 'inline-block';
    imageEl.parentNode.insertBefore(wrapperEl, imageEl);
    wrapperEl.appendChild(imageEl);
    
    this._appContainerEl = document.createElement('DIV');
    wrapperEl.appendChild(this._appContainerEl);

    const { CommentWidget, TagWidget } = Editor;
   
    // A basic ImageAnnotator with just a comment and a tag widget
    ReactDOM.render(
      <ImageAnnotator 
        ref={this._app}
        imageEl={imageEl}
        wrapperEl={wrapperEl}
        readOnly={config.readOnly}
        headless={config.headless}
        onAnnotationSelected={this.handleAnnotationSelected}
        onAnnotationCreated={this.handleAnnotationCreated} 
        onAnnotationUpdated={this.handleAnnotationUpdated} 
        onAnnotationDeleted={this.handleAnnotationDeleted}
        onMouseEnterAnnotation={this.handleMouseEnterAnnotation}
        onMouseLeaveAnnotation={this.handleMouseLeaveAnnotation}>
        
        <CommentWidget />
        <TagWidget />

      </ImageAnnotator>,
    
    this._appContainerEl);
  }

  handleAnnotationSelected = annotation => 
    this._emitter.emit('selectAnnotation', annotation.underlying);

  handleAnnotationCreated = annotation =>
    this._emitter.emit('createAnnotation', annotation.underlying);

  handleAnnotationUpdated = (annotation, previous) =>
    this._emitter.emit('updateAnnotation', annotation.underlying, previous.underlying);

  handleAnnotationDeleted = annotation =>
    this._emitter.emit('deleteAnnotation', annotation.underlying);

  handleMouseEnterAnnotation = (annotation, evt) =>
    this._emitter.emit('mouseEnterAnnotation', annotation.underlying, evt);

  handleMouseLeaveAnnotation = (annotation, evt) =>
    this._emitter.emit('mouseLeaveAnnotation', annotation.underlying, evt);
  
  /******************/               
  /*  External API  */
  /******************/     
  
  /**
   * Adds a single JSON-LD WebAnnotation to the annotation layer.
   */
  addAnnotation = annotation =>
    this._app.current.addAnnotation(new WebAnnotation(annotation));

  /**
   * Removes the given JSON-LD WebAnnotation from the annotation layer.
   */
  removeAnnotation = annotation =>
    this._app.current.removeAnnotation(new WebAnnotation(annotation));

  /** 
   * Loads JSON-LD WebAnnotations from the given URL.
   */
  loadAnnotations = url => axios.get(url).then(response => {
    const annotations = response.data.map(a => new WebAnnotation(a));
    this._app.current.setAnnotations(annotations);
    return annotations;
  });

  /** Initializes the annotation layer with the list of WebAnnotations **/
  setAnnotations = annotations => {
    const webannotations = annotations.map(a => new WebAnnotation(a));
    this._app.current.setAnnotations(webannotations);
  }

  /**
   * Returns all annotations
   */
  getAnnotations = () => {
    const annotations = this._app.current.getAnnotations();
    return annotations.map(a => a._annotation);
  }

  /** Shows or hides the annotation layer **/
  setAnnotationsVisible = visible =>
    this._app.current.setAnnotationsVisible(visible);

  /** Programmatically selects the annotation, opening the editor popup **/
  selectAnnotation = annotationOrId => {
    const arg = (annotationOrId?.type === 'Annotation') ? 
      new WebAnnotation(annotationOrId) : annotationOrId;

    const selected = this._app.current.selectAnnotation(arg);
    return selected?.underlying;
  }

  /** 
   * Applies an annotation template to newly created 
   * selections. The editor will just apply the template and
   * stay closed, unless openEditor is se to true.
   */
  applyTemplate = (template, openEditor) => {
    const bodies = Array.isArray(template) ? template : [ template ];
    this._app.current.applyTemplate(bodies, openEditor);
  }

  /**
   * Unmounts the annotator component
   */
  destroy = () =>
    ReactDOM.unmountComponentAtNode(this._appContainerEl);

  /** Sets user auth information **/
  setAuthInfo = authinfo =>
    Environment.user = authinfo;

  /** Clears the user auth information **/
  clearAuthInfo = () =>
    Environment.user = null;

  /** 
   * Adds an event handler.
   */
  on = (event, handler) =>
    this._emitter.on(event, handler);

  /** 
   * Removes an event handler.
   * 
   * If no callback, removes all handlers for 
   * the given event.
   */
  off = (event, callback) =>
    this._emitter.off(event, callback);

}

export const init = config => new Annotorious(config);

export * from './annotations';
export * from './selection';