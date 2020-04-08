import React, { Component } from 'react';
import AnnotationLayer from './annotations/AnnotationLayer';
import DrawLayer from './annotations/DrawLayer';
import { Editor } from '@recogito/recogito-client-core';

export default class ImageAnnotator extends Component  {

  state = {
    selectedAnnotation: null,
    selectionBounds: null
  }

  /** Shorthand **/
  clearState = () => {
    this.setState({
      selectionBounds: null,
      selectedAnnotation: null
    });
  }

  componentDidMount() {
    this.annotationLayer = new AnnotationLayer(this.props.wrapperEl);
    this.annotationLayer.on('select', evt => this.setState({
      selectedAnnotation: evt.selection,
      selectionBounds: evt.bounds
    }));

    this.drawLayer = new DrawLayer(this.props.wrapperEl);
  }

  /**************************/  
  /* Annotation CRUD events */
  /**************************/    

  /** Selection on the text **/
  handleSelect = evt => {
    const { selection, bounds } = evt;
    if (selection) {
      this.setState({ 
        selectionBounds: bounds,
        selectedAnnotation: selection 
      });
    } else {
      this.clearState();
    }
  }

  /** Common handler for annotation CREATE or UPDATE **/
  onCreateOrUpdateAnnotation = method => (annotation, previous) => {
    this.clearState();    
    this.annotationLayer.addOrUpdateAnnotation(annotation, previous);

    // Call CREATE or UPDATE handler
    this.props[method](annotation, previous);
  }

  onDeleteAnnotation = annotation => {
    this.clearState();
    this.annotationLayer.removeAnnotation(annotation);
  }

  /** Cancel button on annotation editor **/
  onCancelAnnotation = () => {
    this.clearState();
  }

  /****************/               
  /* External API */
  /****************/    

  addAnnotation = annotation => {
    
  }

  removeAnnotation = annotation => {
    
  }

  setAnnotations = annotations => {
    this.annotationLayer.init(annotations);
  }

  getAnnotations = () => {

  }

  render() {
    return (this.state.selectedAnnotation && (
      <Editor
        readOnly={this.props.readOnly}
        bounds={this.state.selectionBounds}
        wrapperEl={this.props.wrapperEl}
        annotation={this.state.selectedAnnotation}
        onAnnotationCreated={this.onCreateOrUpdateAnnotation('onAnnotationCreated')}
        onAnnotationUpdated={this.onCreateOrUpdateAnnotation('onAnnotationUpdated')}
        onAnnotationDeleted={this.onDeleteAnnotation}
        onCancel={this.onCancelAnnotation}>

        {this.props.children}

      </Editor>
    ))
  }

}
