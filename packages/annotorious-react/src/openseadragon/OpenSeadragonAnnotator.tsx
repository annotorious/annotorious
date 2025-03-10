import { createContext, forwardRef, ReactNode, useContext, useEffect, useImperativeHandle, useState } from 'react';
import OpenSeadragon from 'openseadragon';
import { createAnonymousGuest } from '@annotorious/core';
import { AnnotoriousOSDOpts, createOSDAnnotator } from '@annotorious/openseadragon';
import { Annotation, DrawingStyle, Filter, User} from '@annotorious/annotorious';
import { AnnotoriousContext } from '../Annotorious';
import { AnnotoriousOpenSeadragonAnnotator } from '.';

export const OpenSeadragonAnnotatorContext = createContext<{ 
  viewer: OpenSeadragon.Viewer,
  setViewer(viewer: OpenSeadragon.Viewer): void
}>({ viewer: null, setViewer: null });

export type OpenSeadragonAnnotatorProps<I extends Annotation, E extends unknown> = AnnotoriousOSDOpts<I, E> & {

  children?: ReactNode;

  filter?: Filter<I>;

  style?: DrawingStyle | ((annotation: I) => DrawingStyle);

  tool?: string | null;

  user?: User;

}

export const OpenSeadragonAnnotator = forwardRef(<I extends Annotation, E extends unknown>(
  props: OpenSeadragonAnnotatorProps<I, E>, 
  ref: React.ForwardedRef<AnnotoriousOpenSeadragonAnnotator<I, E> | null>
) => {
  const { children, tool, ...opts } = props;

  const [viewer, setViewer] = useState<OpenSeadragon.Viewer>();

  const { anno, setAnno } = useContext(AnnotoriousContext);

  useImperativeHandle(ref, () => anno as AnnotoriousOpenSeadragonAnnotator<I, E> | null, [anno]);

  useEffect(() => {
    if (viewer?.element) {
      const anno = createOSDAnnotator<I, E>(viewer, opts as AnnotoriousOSDOpts<I, E>);
      setAnno(anno);

      return () => {
        anno.destroy();
        setAnno(undefined);
      }
    }
  }, [viewer]);

  useEffect(() => {
    if (anno) anno.setDrawingEnabled(props.drawingEnabled);
  }, [anno, props.drawingEnabled]);

  useEffect(() => {
    if (anno) anno.setFilter(props.filter);
  }, [anno, props.filter]);

  useEffect(() => {
    if (anno) anno.setStyle(props.style);
  }, [anno, props.style]);

  useEffect(() => {
    if (anno) anno.setDrawingTool(tool || 'rectangle');
  }, [anno, tool]);

  useEffect(() => {
    if (anno) anno.setModalSelect(props.modalSelect);
  }, [anno, props.modalSelect]);

  useEffect(() => {
    if (!anno) return;
    
    if (props.user)
      anno.setUser(props.user);
    else 
      anno.setUser(createAnonymousGuest());
  }, [anno, props.user]);

  useEffect(() => {
    if (anno) anno.setUserSelectAction(props.userSelectAction);
  }, [anno, props.userSelectAction]);

  return (
    <OpenSeadragonAnnotatorContext.Provider value={{ viewer, setViewer }}>
      {props.children}
    </OpenSeadragonAnnotatorContext.Provider>
  )

}) as <I extends Annotation, E extends unknown> (
  props: OpenSeadragonAnnotatorProps<I, E> & { ref?: React.ForwardedRef<AnnotoriousOpenSeadragonAnnotator<I, E> | null> }
) => React.ReactElement;

export const useViewer = () => {
  const { viewer } = useContext(OpenSeadragonAnnotatorContext);
  return viewer;
}