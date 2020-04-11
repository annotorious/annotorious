import React, { Component } from 'react';
import AnnotationLayer from './annotations/AnnotationLayer';
import { Editor } from '@recogito/recogito-client-core';

import './ImageAnnotator.scss';

export default class ImageAnnotator extends Component  {

  state = {
    selectedAnnotation: null,
    selectionBounds: null,
    modifiedTarget: null
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

    this.annotationLayer.on('mouseEnterAnnotation', this.props.onMouseEnterAnnotation);
    this.annotationLayer.on('mouseLeaveAnnotation', this.props.onMouseLeaveAnnotation);
    this.annotationLayer.on('select', this.handleSelect);
    this.annotationLayer.on('updateBounds', this.handleUpdateBounds);
  }

  componentWillUnmount() {
    this.annotationLayer.destroy();
  }

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

  handleUpdateBounds = (selectionBounds, modifiedTarget) =>
    this.setState({ selectionBounds, modifiedTarget });
  
  /**************************/  
  /* Annotation CRUD events */
  /**************************/  

  /** Common handler for annotation CREATE or UPDATE **/
  onCreateOrUpdateAnnotation = method => (annotation, previous) => {
    // TODO merge bounds
    const a = (this.state.modifiedTarget) ?
      annotation.clone({ target: { selector: [ this.state.modifiedTarget ]}}) : annotation;

    console.log(a.underlying);

    this.clearState();    
    this.annotationLayer.deselect();
    this.annotationLayer.addOrUpdateAnnotation(a, previous);

    // Call CREATE or UPDATE handler
    this.props[method](a, previous);
  }

  onDeleteAnnotation = annotation => {
    this.clearState();
    this.annotationLayer.removeAnnotation(annotation);
  }

  /** Cancel button on annotation editor **/
  onCancelAnnotation = () => {
    this.clearState();
    this.annotationLayer.deselect();
  }

  /****************/               
  /* External API */
  /****************/    

  addAnnotation = annotation =>
    this.annotationLayer.addOrUpdateAnnotation(annotation);

  removeAnnotation = annotation =>
    this.annotationLayer.removeAnnotation(annotation);

  setAnnotations = annotations =>
    this.annotationLayer.init(annotations);

  getAnnotations = () =>
    this.annotationLayer.getAnnotations();

  setAnnotationsVisible = visible =>
    this.annotationLayer.setAnnotationsVisible(visible);

  selectAnnotation = arg => {
    if (arg)
      this.annotationLayer.selectAnnotation(arg);
    else
      // Deselect
      this.clearState();
  }

  render() {
    return (this.state.selectedAnnotation && (
      <Editor
        wrapperEl={this.props.wrapperEl}
        bounds={this.state.selectionBounds}
        annotation={this.state.selectedAnnotation}
        readOnly={this.props.readOnly}
        onAnnotationCreated={this.onCreateOrUpdateAnnotation('onAnnotationCreated')}
        onAnnotationUpdated={this.onCreateOrUpdateAnnotation('onAnnotationUpdated')}
        onAnnotationDeleted={this.onDeleteAnnotation}
        onCancel={this.onCancelAnnotation}>

        {this.props.children}

      </Editor>
    ))
  }

}
