import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import OpenSeadragon from 'openseadragon';
import { DrawingStyle } from '@annotorious/core';
import { createOSDAnnotator } from '@annotorious/openseadragon';
import { OpenSeadragonAnnotator as AnnotoriousOpenSeadragonAnnotator } from '@annotorious/openseadragon';
import { AnnotoriousOpts, ImageAnnotation } from '@annotorious/annotorious';
import { AnnotoriousContext } from '../Annotorious';

export const OpenSeadragonAnnotatorContext = createContext<{ 
  viewer: OpenSeadragon.Viewer,
  setViewer(viewer: OpenSeadragon.Viewer): void
}>({ viewer: null, setViewer: null });

export type OpenSeadragonAnnotatorProps<E extends unknown> = AnnotoriousOpts<ImageAnnotation, E> & {

  children?: ReactNode;

  drawingEnabled?: boolean;

  tool?: string | null;

}

export const OpenSeadragonAnnotator = <E extends unknown>(props: OpenSeadragonAnnotatorProps<E>) => {

  const { children, drawingEnabled, tool, ...opts } = props;

  const [viewer, setViewer] = useState<OpenSeadragon.Viewer>();

  const { anno, setAnno } = useContext(AnnotoriousContext);

  useEffect(() => {
    if (viewer) {
      const anno = createOSDAnnotator<E>(viewer, opts);
      setAnno(anno);
    }
  }, [viewer]);

  useEffect(() => {
    if (anno)
      (anno as AnnotoriousOpenSeadragonAnnotator).setDrawingTool(tool);
  }, [tool]);

  useEffect(() => {
    if (anno)
      (anno as AnnotoriousOpenSeadragonAnnotator).setDrawingEnabled(drawingEnabled);
  }, [drawingEnabled]);

  useEffect(() => {
    if (anno)    
      anno.style = props.style;
  }, [props.style]);

  return (
    <OpenSeadragonAnnotatorContext.Provider value={{ viewer, setViewer }}>
      {props.children}
    </OpenSeadragonAnnotatorContext.Provider>
  )

}

export const useViewer = () => {
  const { viewer } = useContext(OpenSeadragonAnnotatorContext);
  return viewer;
}