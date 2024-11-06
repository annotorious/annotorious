import React, { useEffect } from 'react';

import { W3CImageFormat } from '@annotorious/annotorious';

import { 
  AnnotoriousImageAnnotator, 
  ImageAnnotationPopup,
  ImageAnnotator, 
  useAnnotator
} from '../../src';

import '@annotorious/annotorious/annotorious.css';

export const App = () => {

  const anno = useAnnotator<AnnotoriousImageAnnotator>();

  useEffect(() => {
    if (anno) {
      fetch('annotations.json')
        .then((response) => response.json())
        .then(annotations => { 
          anno.setAnnotations(annotations)
        });
    }
  }, [anno]);

  return (
    <div>
      <ImageAnnotator 
        adapter={
          W3CImageFormat('https://iiif.bodleian.ox.ac.uk/iiif/image/af315e66-6a85-445b-9e26-012f729fc49c')
        }>
        <img alt="Nice european city" src="/640px-Hallstatt.jpg" />
      </ImageAnnotator>

      <ImageAnnotationPopup
        popup={props => (
          <div>Hello World</div>
        )}
      />
    </div>
  )

}
