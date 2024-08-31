import { AnnotationBody, ImageAnnotation } from '@annotorious/annotorious';

export interface AnnotoriousPopupProps {

  annotation: ImageAnnotation;
  
  editable?: boolean;

  event?: PointerEvent;

  onCreateBody(body: AnnotationBody): void;

  onDeleteBody(id: string): void;

  onUpdateBody(current: AnnotationBody, next: AnnotationBody): void;

}
