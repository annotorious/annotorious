import type { Annotation, ImageAnnotation, SelectionState } from '@annotorious/annotorious';

export const updateSelection = <I extends Annotation = ImageAnnotation, E extends unknown = ImageAnnotation>(
  annotationId: string, 
  event: PointerEvent, 
  selection: SelectionState<I , E>,
  multiSelect?: boolean
) => {
  if (!multiSelect) return annotationId;

  // Note that we are treating SHIFT, CTRL and CMD the same
  const shouldToggle = event.shiftKey || event.ctrlKey || event.metaKey;
  if (shouldToggle) {
    const currentSelection = (selection.selected || []).map(s => s.id);

    // Click should toggle this annotation in or out of the selection
    if (currentSelection.includes(annotationId)) {
      // Remove from selection
      return currentSelection.filter(id => id !== annotationId);
    } else {
      // Add to selection
      return [...currentSelection, annotationId];
    }
  } else {
    // No toggle - just select this annotation
    return annotationId;
  }
} 