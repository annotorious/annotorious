import React from 'react';
import ReactDOM from 'react-dom';
import Emitter from 'tiny-emitter';
import axios from 'axios';
import { WebAnnotation, Editor, Environment, addPolyfills, setLocale } from '@recogito/recogito-client-core'; 
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

    setLocale(config.locale);

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

  handleAnnotationSelected = annotation => 
    this._emitter.emit('selectAnnotation', annotation.underlying);

  handleAnnotationCreated = annotation =>
    this._emitter.emit('createAnnotation', annotation.underlying);

  handleAnnotationDeleted = annotation =>
    this._emitter.emit('deleteAnnotation', annotation.underlying);

  handleAnnotationUpdated = (annotation, previous) =>
    this._emitter.emit('updateAnnotation', annotation.underlying, previous.underlying);

  handleMouseEnterAnnotation = (annotation, evt) =>
    this._emitter.emit('mouseEnterAnnotation', annotation.underlying, evt);

  handleMouseLeaveAnnotation = (annotation, evt) =>
    this._emitter.emit('mouseLeaveAnnotation', annotation.underlying, evt);

  handleSelectionCreated = selection =>
    this._emitter.emit('createSelection', selection._stub);

  handleSelectionTargetChanged = target => 
    this._emitter.emit('changeSelectionTarget', target);

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

  destroy = () =>
    ReactDOM.unmountComponentAtNode(this._appContainerEl);

  getAnnotations = () => {
    const annotations = this._app.current.getAnnotations();
    return annotations.map(a => a.underlying);
  }
  
  loadAnnotations = url => axios.get(url).then(response => {
    const annotations = response.data.map(a => new WebAnnotation(a));
    this._app.current.setAnnotations(annotations);
    return annotations;
  });

  on = (event, handler) =>
    this._emitter.on(event, handler);

  off = (event, callback) =>
    this._emitter.off(event, callback);
  
  removeAnnotation = annotation =>
    this._app.current.removeAnnotation(new WebAnnotation(annotation));

  selectAnnotation = annotationOrId => {
    const arg = (annotationOrId?.type === 'Annotation') ? 
      new WebAnnotation(annotationOrId) : annotationOrId;

    const selected = this._app.current.selectAnnotation(arg);
    return selected?.underlying;
  }

  setAuthInfo = authinfo =>
    Environment.user = authinfo;

  setAnnotations = annotations => {
    const webannotations = annotations.map(a => new WebAnnotation(a));
    this._app.current.setAnnotations(webannotations);
  }

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
