import { Children, ReactElement, cloneElement, useContext, useEffect } from 'react';
import { AnnotoriousOpts, createImageAnnotator, DrawingTool } from '@annotorious/annotorious';
import type { ImageAnnotation, ImageAnnotator as AnnotoriousImageAnnotator } from '@annotorious/annotorious';
import { AnnotoriousContext } from './Annotorious';

export interface ImageAnnotatorProps<E extends unknown> extends AnnotoriousOpts<ImageAnnotation, E> {

  children: ReactElement<HTMLImageElement>;

  tool?: DrawingTool

}

export const ImageAnnotator = <E extends unknown>(props: ImageAnnotatorProps<E>) => {

  const { children, tool, ...opts } = props;

  const child = Children.only(children);

  const { anno, setAnno } = useContext(AnnotoriousContext);

  const onLoad = (evt: Event) => {
    if (!anno) {
      const img = evt.target as HTMLImageElement;

      const next = createImageAnnotator(img, opts);
      setAnno(next); 
    }
  };

  useEffect(() => {
    if (props.tool && anno)
      (anno as AnnotoriousImageAnnotator).setDrawingTool(props.tool);
  }, [props.tool, anno]);
 
  return <>{cloneElement(child, { onLoad }  as Partial<HTMLImageElement>)}</>

}