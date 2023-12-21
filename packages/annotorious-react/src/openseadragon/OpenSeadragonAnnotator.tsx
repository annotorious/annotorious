import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import OpenSeadragon from 'openseadragon';
import { createOSDAnnotator } from '@annotorious/openseadragon';
import { AnnotoriousOpts, DrawingStyle, Filter, ImageAnnotation } from '@annotorious/annotorious';
import { AnnotoriousContext } from '../Annotorious';

export const OpenSeadragonAnnotatorContext = createContext<{ 
  viewer: OpenSeadragon.Viewer,
  setViewer(viewer: OpenSeadragon.Viewer): void
}>({ viewer: null, setViewer: null });

export type OpenSeadragonAnnotatorProps<E extends unknown> = AnnotoriousOpts<ImageAnnotation, E> & {

  children?: ReactNode;

  drawingEnabled?: boolean;

  filter?: Filter<ImageAnnotation>;

  style?: DrawingStyle | ((annotation: ImageAnnotation) => DrawingStyle);

  tool?: string | null;

}

export const OpenSeadragonAnnotator = <E extends unknown>(props: OpenSeadragonAnnotatorProps<E>) => {

  const { children, tool, ...opts } = props;

  const [viewer, setViewer] = useState<OpenSeadragon.Viewer>();

  const { anno, setAnno } = useContext(AnnotoriousContext);

  useEffect(() => {
    if (viewer) {
      const anno = createOSDAnnotator<E>(viewer, opts);

      if (props.tool)
        anno.setDrawingTool(props.tool);

      setAnno(anno);

      return () => {
        anno.destroy();
        setAnno(undefined);
      }
    }
  }, [viewer]);

  useEffect(() => {
    if (anno) anno.setDrawingTool(tool);
  }, [tool]);

  useEffect(() => {
    if (anno) anno.setDrawingEnabled(props.drawingEnabled);
  }, [props.drawingEnabled]);

  useEffect(() => {
    if (anno) anno.setFilter(props.filter);
  }, [props.filter]);

  useEffect(() => {
    if (anno) anno.setStyle(props.style);
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