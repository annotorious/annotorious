import type { ImageAnnotation, ImageAnnotationStore } from '@annotorious/annotorious/src';
import type { SelectionState } from '@annotorious/core';

export const initKeyCommands = (
  container: HTMLElement, 
  selection: SelectionState<ImageAnnotation>,
  store: ImageAnnotationStore
) => {

  const onDeleteSelection = () => {
    const { selected } = selection;
    if (selected) {
      const editable = selected.filter(s => s.editable);
      if (editable.length > 0)
        store.bulkDeleteAnnotation(editable.map(s => s.id));
    }
  }

  container.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Delete') {
      onDeleteSelection();
    }
  });

}