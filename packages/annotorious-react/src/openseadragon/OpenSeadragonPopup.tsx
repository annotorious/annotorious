import { ReactNode, useEffect, useRef, useState } from 'react';
import { ImageAnnotation } from '@annotorious/annotorious';
import OpenSeadragon from 'openseadragon';
import { AnnotoriousPopupProps, Draggable } from '../AnnotoriousPopup';
import { useViewer } from './OpenSeadragonAnnotator';
import { useSelection } from '../Annotorious';
import { setPosition } from './setPosition';

export type OpenSeadragonPopupProps = AnnotoriousPopupProps & {

  viewer: OpenSeadragon.Viewer

}

export type OpenSeadragonPopupContainerProps = {

  popup(props: OpenSeadragonPopupProps): ReactNode

}

export const OpenSeadragonPopup = (props: OpenSeadragonPopupContainerProps) => {

  const el = useRef<HTMLDivElement>(null);

  const viewer = useViewer();

  const { selected } = useSelection<ImageAnnotation>();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [dragged, setDragged] = useState(false);

  const onDragStart = () => setDragged(true);

  const updatePosition = () => {
    // Note: this popup only supports a single selection
    const annotation = selected[0].annotation;
    setPosition(viewer, annotation, el.current);
  }

  const equal = (a: string[], b: string[]) => 
    a.every(str => b.includes(str)) && b.every(str => a.includes(str));

  useEffect(() => {
    // Reset drag flag if selected IDs have changed
    const nextIds = selected.map(({ annotation }) => annotation.id);

    if (!equal(selectedIds, nextIds)) {
      setDragged(false);
      setSelectedIds(nextIds);
    }
  }, [selected]);

  useEffect(() => {
    if (!el.current) return;

    if (!dragged) updatePosition();

    const onUpdateViewport = () => {
      if (!dragged) updatePosition();
    }

    viewer.addHandler('update-viewport', onUpdateViewport);

    return () => {
      viewer.removeHandler('update-viewport', onUpdateViewport);
    }
  }, [selected, dragged]);
  
  return selected.length > 0 ? (
    <Draggable 
      ref={el} 
      key={selected.map(({ annotation }) => annotation.id).join('-')} 
      className="a9s-popup a9s-osd-popup" 
      onDragStart={onDragStart}>

      {props.popup({ viewer, selected })}
      
    </Draggable>
  ) : null;

}