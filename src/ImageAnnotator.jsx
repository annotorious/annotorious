import React, { Component } from 'react';
import AnnotationLayer from './annotations/AnnotationLayer';
import { Editor } from '@recogito/recogito-client-core';

export default class ImageAnnotator extends Component  {

  state = {
    selectedAnnotation: null,
    selectionBounds: null
  }

  constructor(props) {
    super(props);

    this._annotationLayer = new AnnotationLayer(props.image.parentNode);
    this._annotationLayer.on('select', evt => this.setState({
      selectedAnnotation: evt.selection,
      selectionBounds: evt.bounds
    }));
  }

  /****************/               
  /* External API */
  /****************/    

  addAnnotation = annotation => {
    
  }

  removeAnnotation = annotation => {
    
  }

  setAnnotations = annotations => {
    this._annotationLayer.init(annotations);
  }

  getAnnotations = () => {

  }

  render() {
    console.log(this.state.selectionBounds);
    
    return (this.state.selectedAnnotation && (
      <Editor
        readOnly={this.props.readOnly}
        bounds={this.state.selectionBounds}
        containerEl={this.props.containerEl}
        annotation={this.state.selectedAnnotation}
        onAnnotationCreated={() => console.log('foo')}
        onAnnotationUpdated={() => console.log('foo')}
        onAnnotationDeleted={() => console.log('foo')}
        onCancel={() => console.log('foo')}>

        {this.props.children}

      </Editor>
    ))
  }

}
