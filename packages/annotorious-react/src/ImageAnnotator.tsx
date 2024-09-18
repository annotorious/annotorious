import { Children, ReactElement, cloneElement, useContext, useEffect } from 'react';
import { AnnotoriousOpts, createImageAnnotator } from '@annotorious/annotorious';
import type { DrawingTool, Filter, ImageAnnotation } from '@annotorious/annotorious';
import { AnnotoriousContext } from './Annotorious';

export interface ImageAnnotatorProps<E extends unknown> extends AnnotoriousOpts<ImageAnnotation, E> {

  children: ReactElement<HTMLImageElement>;

  containerClassName?: string;

  filter?: Filter<ImageAnnotation>;

  tool?: DrawingTool;

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
    if (!anno || !props.containerClassName) return;
    anno.element.className = props.containerClassName;
  }, [props.containerClassName, anno]);

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
    if (tool && anno) anno.setDrawingTool(props.tool);
  }, [tool, anno]);

  useEffect(() => {
    if (anno) anno.setUserSelectAction(props.userSelectAction);
  }, [props.userSelectAction]);
 
  return <>{cloneElement(child, { onLoad }  as Partial<HTMLImageElement>)}</>

}
