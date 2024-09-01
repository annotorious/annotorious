import { ReactNode, useEffect, useRef, useState } from 'react';
import OpenSeadragon from 'openseadragon';
import { v4 as uuidv4 } from 'uuid';
import { useAnnotator, useSelection, useViewer} from '@annotorious/react';
import type { AnnotoriousPopupProps } from '@annotorious/react';
import type { AnnotationBody, Annotator, Geometry, ImageAnnotation } from '@annotorious/annotorious';
import { toClientRects } from '../utils/toClientRects';
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

const toDOMRect = (viewer: OpenSeadragon.Viewer, geometry: Geometry) => {
  const { minX, minY, maxX, maxY } = geometry.bounds;

  const topLeft = viewer.viewport.imageToWindowCoordinates(new OpenSeadragon.Point(minX, minY));
  const bottomRight = viewer.viewport.imageToWindowCoordinates(new OpenSeadragon.Point(maxX, maxY));

  return new DOMRect(
    topLeft.x,
    topLeft.y,
    bottomRight.x  - topLeft.x,
    bottomRight.y - topLeft.y
  );
}

interface OpenSeadragonAnnotationPopupProps {

  arrow?: boolean;

  popup: (props: AnnotoriousPopupProps) => ReactNode;

}

export const OpenSeadragonAnnotationPopup = (props: OpenSeadragonAnnotationPopupProps) => {
  
  const anno = useAnnotator<Annotator<ImageAnnotation>>();

  const [isOpen, setIsOpen] = useState(false);

  const viewer = useViewer();

  const arrowRef = useRef(null);

  const { selected, event } = useSelection();

  const annotation = selected[0]?.annotation;

  const editable = selected[0]?.editable;

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      inline(), 
      offset(10),
      flip({ crossAxis: true }),
      shift({ 
        crossAxis: true,
        boundary: viewer?.element,
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
        
        const rect = toDOMRect(viewer, annotation.target.selector.geometry);
        
        refs.setReference({
          getBoundingClientRect: () => rect,
          getClientRects: () => toClientRects(rect)
        });
      }

      setPosition();

      viewer.addHandler('update-viewport', setPosition);

      setIsOpen(true);
    }
  }, [props.popup, selected, viewer]);

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

  return isOpen && annotation && (
    <div
      className="a9s-popup a9s-image-popup"
      ref={refs.setFloating}
      style={floatingStyles}>

      <FloatingArrow 
        ref={arrowRef} 
        context={context} 
        fill="#fff" />

      {props.popup({ 
        annotation, 
        editable, 
        event,
        onCreateBody,
        onDeleteBody,
        onUpdateBody
      })}
    </div>
  )

}