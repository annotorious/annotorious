import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import OpenSeadragon from 'openseadragon';
import { createOSDAnnotator } from '@annotorious/openseadragon';
import { Annotation, AnnotoriousOpts, DrawingStyle, Filter, ImageAnnotation } from '@annotorious/annotorious';
import { AnnotoriousContext } from '../Annotorious';

export const OpenSeadragonAnnotatorContext = createContext<{ 
  viewer: OpenSeadragon.Viewer,
  setViewer(viewer: OpenSeadragon.Viewer): void
}>({ viewer: null, setViewer: null });

export type OpenSeadragonAnnotatorProps<I extends Annotation, E extends unknown> = AnnotoriousOpts<I, E> & {

  children?: ReactNode;

  filter?: Filter<I>;

  style?: DrawingStyle | ((annotation: I) => DrawingStyle);

  tool?: string | null;

}

export const OpenSeadragonAnnotator = <I extends Annotation, E extends unknown>(props: OpenSeadragonAnnotatorProps<I, E>) => {

  const { children, tool, ...opts } = props;

  const [viewer, setViewer] = useState<OpenSeadragon.Viewer>();

  const { anno, setAnno } = useContext(AnnotoriousContext);

  useEffect(() => {
    if (viewer) {
      const anno = createOSDAnnotator<I, E>(viewer, opts as AnnotoriousOpts<I, E>);

      if (props.drawingEnabled !== undefined) anno.setDrawingEnabled(props.drawingEnabled);
      if (props.filter) anno.setFilter(props.filter);
      if (props.style) anno.setStyle(props.style);
      if (props.tool) anno.setDrawingTool(props.tool);

      setAnno(anno);

      return () => {
        anno.destroy();
        setAnno(undefined);
      }
    }
  }, [viewer]);

  useEffect(() => {
    if (anno) anno.setDrawingEnabled(props.drawingEnabled);
  }, [props.drawingEnabled]);

  useEffect(() => {
    if (anno) anno.setFilter(props.filter);
  }, [props.filter]);

  useEffect(() => {
    if (anno) anno.setStyle(props.style);
  }, [props.style]);

  useEffect(() => {
    if (anno) anno.setDrawingTool(tool);
  }, [tool]);

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