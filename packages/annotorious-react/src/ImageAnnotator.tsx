import { Children, ReactElement, cloneElement, useContext, useEffect } from 'react';
import { AnnotoriousOpts, createImageAnnotator } from '@annotorious/annotorious';
import type { DrawingStyle, DrawingTool, Filter, ImageAnnotation } from '@annotorious/annotorious';
import { AnnotoriousContext } from './Annotorious';

export interface ImageAnnotatorProps<E extends unknown> extends AnnotoriousOpts<ImageAnnotation, E> {

  children: ReactElement<HTMLImageElement>;

  filter?: Filter<ImageAnnotation>;

  style?: DrawingStyle | ((annotation: ImageAnnotation) => DrawingStyle);

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
    if (props.tool && anno) anno.setDrawingTool(props.tool);
  }, [props.tool, anno]);

  useEffect(() => {
    if (anno) anno.setFilter(props.filter);
  }, [props.filter]);

  useEffect(() => {
    if (anno) anno.setStyle(props.style);
  }, [props.style]);
 
  return <>{cloneElement(child, { onLoad }  as Partial<HTMLImageElement>)}</>

}