import { Children, ReactElement, cloneElement, useContext, useEffect } from 'react';
import { createImageAnnotator, DrawingTool } from '@annotorious/annotorious';
import type { ImageAnnotator as AnnotoriousImageAnnotator } from '@annotorious/annotorious';
import { AnnotoriousContext } from './Annotorious';

export interface ImageAnnotatorProps {

  children: ReactElement<HTMLImageElement>;

  tool?: DrawingTool

}

export const ImageAnnotator = (props: ImageAnnotatorProps) => {

  const child = Children.only(props.children);

  const { anno, setAnno } = useContext(AnnotoriousContext);

  const onLoad = (evt: Event) => {
    if (!anno) {
      const img = evt.target as HTMLImageElement;

      const next = createImageAnnotator(img);
      setAnno(next); 
    }
  };

  useEffect(() => {
    if (props.tool && anno)
      (anno as AnnotoriousImageAnnotator).setDrawingTool(props.tool);
  }, [props.tool, anno]);
 
  return <>{cloneElement(child, { onLoad }  as Partial<HTMLImageElement>)}</>

}