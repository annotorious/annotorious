import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Annotation } from '@annotorious/core';
import { ImageAnnotation } from '@annotorious/annotorious';
import { useAnnotator } from '../Annotorious';
import { AnnotoriousOpenSeadragonAnnotator, useViewer } from '.';

interface HoverTooltipContentProps <T extends Annotation = ImageAnnotation> {
   
  annotation: T;

}

interface OpenSeadragonHoverTooltipProps {

  offsetX?: number;

  offsetY?: number;

  tooltip: (props: HoverTooltipContentProps) => ReactNode;

}

const DEFAULT_OFFSET = 10;

export const OpenSeadragonHoverTooltip = (props: OpenSeadragonHoverTooltipProps) => {

  const offsetX = props.offsetX || DEFAULT_OFFSET;
  const offsetY = props.offsetY || DEFAULT_OFFSET;

  const anno = useAnnotator<AnnotoriousOpenSeadragonAnnotator>();

  const viewer = useViewer();

  const [pos, setPos] = useState<{ x: number, y: number } | undefined>();

  const [hovered, setHovered] = useState<ImageAnnotation | undefined>();

  useEffect(() => {
    if (!anno || !viewer) return;

    const onHover = (id: string) => {
      if (id)
        setHovered(anno.state.store.getAnnotation(id));
      else
        setHovered(undefined);
    }

    const onPointerMove = (evt: PointerEvent) => {
      const { offsetX: x, offsetY: y } = evt;
      setPos({ x, y });
    }

    viewer.element.addEventListener('pointermove', onPointerMove);
    const unsubscribe = anno.state.hover.subscribe(onHover);

    return () => {
      viewer.element?.removeEventListener('pointermove', onPointerMove);
      unsubscribe();
    }
  }, [anno, viewer]);

  return (hovered && pos) && createPortal(
    <div 
      style={{ 
        position: 'absolute',
        top: `${pos.y + offsetY}px`,
        left: `${pos.x + offsetX}px`
      }}>
      {props.tooltip({ annotation: hovered })}
    </div>
  , viewer.element)

}