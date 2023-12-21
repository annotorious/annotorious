import { forwardRef, ReactNode } from 'react';
import { ImageAnnotation } from '.';
import { useDraggable } from '@neodrag/react';

export interface AnnotoriousPopupProps {

  selected: { annotation: ImageAnnotation, editable?: boolean }[];

}

export interface DraggableProps {

  children: ReactNode;

  className?: string;

  onDragStart?(): void;

  onDragEnd?(): void;

}

export const Draggable = forwardRef((props: DraggableProps, ref: React.MutableRefObject<HTMLDivElement>)  => {

  const { children, className, onDragStart, onDragEnd } = props;

  useDraggable(ref, { onDragStart, onDragEnd, cancel: 'button, .no-drag' });

  return (
    <div 
      ref={ref} 
      className={className} 
      style={{ position: 'absolute' }}>
      {children}
    </div>
  )

});