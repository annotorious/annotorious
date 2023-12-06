import type { UndoStack } from '@annotorious/core';

const isMac = navigator.userAgent.indexOf('Mac OS X') !== -1;

export const initKeyboardCommands = (
  undoStack: UndoStack
) => {

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
      document.removeEventListener('keydown', onMacKeyDown);
    } else {
      document.removeEventListener('keydown', onWinKeyDown);
    }
  }

  if (isMac)
    document.addEventListener('keydown', onMacKeyDown);
  else
    document.addEventListener('keydown', onWinKeyDown);

  return { 
    destroy
  }
}
