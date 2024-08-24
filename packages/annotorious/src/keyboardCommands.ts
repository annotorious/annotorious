import type { Annotation, UndoStack } from '@annotorious/core';

export const isMac = (() => {
  if (typeof navigator === 'undefined') return false;

  return navigator.userAgent.indexOf('Mac OS X') !== -1;
})();

export const initKeyboardCommands = <T extends Annotation>(
  undoStack: UndoStack<T>,
  container?: Element 
) => {

  const el = container || document;

  const onWinKeyDown = (evt: Event) => {
    const event = evt as KeyboardEvent;
    
    if (event.key === 'z' && event.ctrlKey) {
      undoStack.undo();
    } else if (event.key === 'y' && event.ctrlKey) {
      undoStack.redo()
    }
  };

  const onMacKeyDown = (evt: Event) => {
    const event = evt as KeyboardEvent;

    if (event.key === 'z' && event.metaKey) {
      if (event.shiftKey) {
        undoStack.redo()
      } else {
        undoStack.undo();
      }
    }
  }

  const destroy = () => {
    if (isMac) {
      el.removeEventListener('keydown', onMacKeyDown);
    } else {
      el.removeEventListener('keydown', onWinKeyDown);
    }
  }

  if (isMac)
    el.addEventListener('keydown', onMacKeyDown);
  else
    el.addEventListener('keydown', onWinKeyDown);

  return { 
    destroy
  }
}
