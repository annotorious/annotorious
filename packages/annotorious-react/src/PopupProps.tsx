import { Annotation, AnnotationBody, ImageAnnotation } from '@annotorious/annotorious';

export interface PopupProps <T extends Annotation = ImageAnnotation> {

  annotation: T;
  
  editable?: boolean;

  event?: PointerEvent | KeyboardEvent;

  onCreateBody(body: Partial<AnnotationBody>): void;

  onDeleteBody(id: string): void;

  onUpdateBody(current: AnnotationBody, next: Partial<AnnotationBody>): void;

}
