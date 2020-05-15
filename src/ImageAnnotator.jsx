import React, { Component } from 'react';
import AnnotationLayer from './annotations/AnnotationLayer';
import { Editor } from '@recogito/recogito-client-core';

import './ImageAnnotator.scss';

export default class ImageAnnotator extends Component  {

  state = {
    selectedAnnotation: null,
    selectedDOMElement: null,
    modifiedTarget: null,

    applyTemplate: null,
    applyImmediately: null
  }

  /** Shorthand **/
  clearState = () => this.setState({
    selectedAnnotation: null,
    selectedDOMElement: null,
    modifiedTarget: null
  });

  componentDidMount() {
    this.annotationLayer = new AnnotationLayer(this.props);
    this.annotationLayer.on('mouseEnterAnnotation', this.props.onMouseEnterAnnotation);
    this.annotationLayer.on('mouseLeaveAnnotation', this.props.onMouseLeaveAnnotation);
    this.annotationLayer.on('select', this.handleSelect);
    this.annotationLayer.on('updateTarget', this.handleUpdateTarget);
  }

  componentWillUnmount() {
    this.annotationLayer.destroy();
  }

  handleSelect = evt => {
    const { annotation, element } = evt;
    if (annotation) {
      this.setState({ 
        selectedAnnotation: annotation,
        selectedDOMElement: element
      });

      if (!annotation.isSelection)
        this.props.onAnnotationSelected(annotation.clone());
    } else {
      this.clearState();
    }
  }

  handleUpdateTarget = (selectedDOMElement, modifiedTarget) =>
    this.setState({ selectedDOMElement, modifiedTarget });

  /**************************/  
  /* Annotation CRUD events */
  /**************************/  

  /** Common handler for annotation CREATE or UPDATE **/
  onCreateOrUpdateAnnotation = method => (annotation, previous) => {
    // Merge updated target if necessary
    const a = (this.state.modifiedTarget) ?
      annotation.clone({ target: this.state.modifiedTarget }) : annotation.clone();

    this.clearState();    
    this.annotationLayer.deselect();
    this.annotationLayer.addOrUpdateAnnotation(a, previous);

    // Call CREATE or UPDATE handler
    this.props[method](a, previous?.clone());
  }

  onDeleteAnnotation = annotation => {
    this.clearState();
    this.annotationLayer.removeAnnotation(annotation);
    this.props.onAnnotationDeleted(annotation);
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
    this.annotationLayer.addOrUpdateAnnotation(annotation.clone());

  removeAnnotation = annotation =>
    this.annotationLayer.removeAnnotation(annotation.clone());

  setAnnotations = annotations =>
    this.annotationLayer.init(annotations.map(a => a.clone()));

  getAnnotations = () =>
    this.annotationLayer.getAnnotations().map(a => a.clone());

  setAnnotationsVisible = visible =>
    this.annotationLayer.setAnnotationsVisible(visible);

  selectAnnotation = arg => {
    if (arg)
      this.annotationLayer.selectAnnotation(arg);
    else
      // Deselect
      this.clearState();
  }

  applyTemplate = (bodies, openEditor) =>
    this.setState({ applyTemplate: bodies, applyImmediately: !openEditor });

  render() {
    // The editor should open under normal conditions (no headless mode, annotation was selected),
    // or if we are in headless mode for immediate template application 
    const normalConditions = this.state.selectedAnnotation && !this.props.headless;

    const headlessApply =
      this.props.headless && 
      this.state.applyTemplate && 
      this.state.selectedAnnotation?.isSelection;

    const open = (normalConditions == true || headlessApply == true);

    return (open && (
      <Editor
        wrapperEl={this.props.wrapperEl}
        annotation={this.state.selectedAnnotation}
        selectedElement={this.state.selectedDOMElement}
        readOnly={this.props.readOnly}
        applyTemplate={this.state.applyTemplate}
        applyImmediately={this.state.applyImmediately}
        onAnnotationCreated={this.onCreateOrUpdateAnnotation('onAnnotationCreated')}
        onAnnotationUpdated={this.onCreateOrUpdateAnnotation('onAnnotationUpdated')}
        onAnnotationDeleted={this.onDeleteAnnotation}
        onCancel={this.onCancelAnnotation}>

        {this.props.children}

      </Editor>
    ))
  }

}
