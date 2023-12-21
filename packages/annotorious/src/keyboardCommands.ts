import type { Annotation, UndoStack } from '@annotorious/core';

const isMac = navigator.userAgent.indexOf('Mac OS X') !== -1;

export const initKeyboardCommands = <T extends Annotation>(
  undoStack: UndoStack<T>,
  container?: Element 
) => {

  const el = container || document;

  const onWinKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Z' && event.ctrlKey) {
      undoStack.undo();
    } else if (event.key === 'Y' && event.ctrlKey) {
      undoStack.redo()
    }
  };

  const onMacKeyDown = (event: KeyboardEvent) => {
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
