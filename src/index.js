import React from 'react';
import ReactDOM from 'react-dom';
import Emitter from 'tiny-emitter';
import axios from 'axios';
import { WebAnnotation, Editor } from '@recogito/recogito-client-core'; 
import ImageAnnotator from './ImageAnnotator';

import '@recogito/recogito-client-core/themes/default';

/**
 * The entrypoint into the application. Provides the 
 * externally visible JavaScript API.
 */
class Annotorious {

  constructor(config) {   
    // Programmatic calls to this instance from outside are forwarded
    // through a ref
    this._app = React.createRef();

    // Event handling via tiny-emitter
    this._emitter = new Emitter();

    // Image is wrapped in a container DIV, and the application 
    // DIV (which contains the editor popup) is attached as a sibling
    let image = (config.image.nodeType) ? 
      config.image : document.getElementById(config.image);

    const wrapper = document.createElement('DIV');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    
    image.parentNode.insertBefore(wrapper, image);
    wrapper.appendChild(image);
    
    const container = document.createElement('DIV');
    container.style.position = 'absolute';
    container.style.top = 0;
    container.style.left = 0;
    container.style.width = '100%';
    container.style.height = '100%';
    wrapper.appendChild(container);

    const { CommentWidget, TagWidget } = Editor;
   
    // A basic ImageAnnotator with just a comment and a tag widget
    ReactDOM.render(
      <ImageAnnotator 
        ref={this._app}
        image={image}
        containerEl={container}>
        
        <CommentWidget />
        <TagWidget />

      </ImageAnnotator>,
    
    container);
  }

  handleAnnotationCreated = annotation =>
    this._emitter.emit('createAnnotation', annotation);

  handleAnnotationUpdated = (annotation, previous) =>
    this._emitter.emit('updateAnnotation', annotation, previous);

  handleAnnotationDeleted = annotation =>
    this._emitter.emit('deleteAnnotation', annotation);
  
  /******************/               
  /*  External API  */
  /******************/     
  
  /**
   * Adds a JSON-LD WebAnnotation to the annotation layer.
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

  /**
   * Returns all annotations
   */
  getAnnotations = () => 
    this._app.current.getAnnotations();

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
