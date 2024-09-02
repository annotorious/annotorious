import { Annotation, AnnotationBody, ImageAnnotation } from '@annotorious/annotorious';

export interface PopupProps <T extends Annotation = ImageAnnotation> {

  annotation: T;
  
  editable?: boolean;

  event?: PointerEvent;

  onCreateBody(body: AnnotationBody): void;

  onDeleteBody(id: string): void;

  onUpdateBody(current: AnnotationBody, next: AnnotationBody): void;

}
