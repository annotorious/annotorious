import { ReactNode, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AnnotationBody, Geometry } from '@annotorious/annotorious';
import {
  useFloating,
  arrow,
  shift,
  inline,
  autoUpdate,
  flip,
  offset,
  FloatingArrow
} from '@floating-ui/react';
import { useAnnotator, useSelection } from './Annotorious';
import { PopupProps } from './PopupProps';
import { toClientRects } from './utils/toClientRects';
import { ImageAnnotator } from '@annotorious/openseadragon';

const toDOMRect = (geometry: Geometry, container: HTMLDivElement) => {
  const img = container.querySelector('img');

  const { left, top } = img.getBoundingClientRect();

  const kx = img.offsetWidth / img.naturalWidth;
  const ky = img.offsetHeight / img.naturalHeight;

  const { minX, minY, maxX, maxY } = geometry.bounds;

  return new DOMRect(
    left + kx * minX,
    top + ky * minY,
    kx * (maxX - minX),
    ky * (maxY - minY)
  );
}

interface ImageAnnotationPopupProps {

  arrow?: boolean;

  popup: (props: PopupProps) => ReactNode;

}

export const ImageAnnotationPopup = (props: ImageAnnotationPopupProps) => {

  const anno = useAnnotator<ImageAnnotator>();

  const [isOpen, setIsOpen] = useState(false);

  const arrowRef = useRef(null);

  const { selected, event } = useSelection();

  const annotation = selected[0]?.annotation;

  const editable = selected[0]?.editable;

  const { refs, floatingStyles, context, update } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      inline(), 
      offset(10),
      flip({ crossAxis: true }),
      shift({ 
        crossAxis: true,
        padding: { right: 5, left: 5, top: 10, bottom: 10 }
      }),
      arrow({
        element: arrowRef,
        padding: 5
      })
    ],
    whileElementsMounted: autoUpdate
  });

  useEffect(() => {
    if (selected.length === 0) {
      setIsOpen(false);
    } else {
      const setPosition = () => { 
        const rect = toDOMRect(annotation.target.selector.geometry, anno.element);

        refs.setReference({
          getBoundingClientRect: () => rect,
          getClientRects: () => toClientRects(rect)
        });
      }

      window.addEventListener('scroll', setPosition, true);
      window.addEventListener('resize', setPosition);

      setPosition();

      setIsOpen(true);

      return () => {
        window.removeEventListener('scroll', setPosition, true);
        window.removeEventListener('resize', setPosition);
      };
    }
  }, [anno, props.popup, selected]);

  const onCreateBody = (body: Partial<AnnotationBody>) => {
    const id = body.id || uuidv4();
    
    anno.state.store.addBody({
      ...body,
      id,
      annotation: annotation.id,
      created: body.created || new Date(),
      creator: anno.getUser()
    });
  }

  const onDeleteBody = (id: string) => {
    anno.state.store.deleteBody({ id, annotation: annotation.id });
  }

  const onUpdateBody = (current: AnnotationBody, next: AnnotationBody) => {
    const id = next.id || uuidv4();

    const updated: AnnotationBody = {
      updated: new Date(),
      updatedBy: anno.getUser(),
      ...next,
      id,
      annotation: annotation.id
    }

    anno.state.store.updateBody(current, updated);
  }

  return (isOpen && annotation) ? (
    <div
      className="a9s-popup a9s-image-popup"
      ref={refs.setFloating}
      style={floatingStyles}>

      <FloatingArrow 
        ref={arrowRef} 
        context={context} />

      {props.popup({ 
        annotation, 
        editable, 
        event,
        onCreateBody,
        onDeleteBody,
        onUpdateBody
      })}
    </div>
  ) : null;

}
