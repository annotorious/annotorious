import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import OpenSeadragon from 'openseadragon';
import { Annotator, Formatter } from '@annotorious/core';
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

  formatter?: Formatter;

  keepEnabled?: boolean;

  tool?: string | null;

}

export const OpenSeadragonAnnotator = <E extends unknown>(props: OpenSeadragonAnnotatorProps<E>) => {

  const { children, keepEnabled, tool, ...opts } = props;

  const [viewer, setViewer] = useState<OpenSeadragon.Viewer>();

  const { anno, setAnno } = useContext(AnnotoriousContext);

  useEffect(() => {
    if (viewer) {
      const anno = createOSDAnnotator<E>(viewer, opts);
      anno.setFormatter(props.formatter);
      setAnno(anno);
    }
  }, [viewer]);

  useEffect(() => {
    if (!anno)
      return;

    if (props.tool)
      (anno as AnnotoriousOpenSeadragonAnnotator).startDrawing(props.tool, props.keepEnabled);
    else
      (anno as AnnotoriousOpenSeadragonAnnotator).stopDrawing();
  }, [props.tool, props.keepEnabled]);

  useEffect(() => {
    if (!anno)
      return;
    
    (anno as AnnotoriousOpenSeadragonAnnotator).setFormatter(props.formatter);
  }, [props.formatter]);

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