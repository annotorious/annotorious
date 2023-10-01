import { beforeEach, describe, it, expect } from 'vitest';
import { type Store, createStore, createSelectionState } from '../../src/state';
import type { Annotation } from '../../src/model';

const testAnnotation1: Annotation = {
  id: 'test-id-1',
  target: null,
  bodies: [],
};

const testAnnotation2: Annotation = {
  id: 'test-id-2',
  target: null,
  bodies: [],
}

const testAnnotation3: Annotation = {
  id: 'test-id-3',
  target: null,
  bodies: [],
};

describe('createSelectionState', () => {
  let store: Store<Annotation>;

  let selectionState: ReturnType<typeof createSelectionState>;

  beforeEach(() => {
    store = createStore<Annotation>();
    store.bulkAddAnnotation([testAnnotation1, testAnnotation2, testAnnotation3]);
    selectionState = createSelectionState(store);
  });

  describe('clickSelect', () => {

    it('should set the selection to an array containing the clicked annotation', () => {
      selectionState.clickSelect(testAnnotation1.id);
      expect(selectionState.isEmpty()).toBe(false);
      expect(selectionState.isSelected(testAnnotation1)).toBe(true);
    });

  });

  describe('setSelected', () => {

    it('should set the selection to an array of annotations with the given IDs', () => {
      selectionState.setSelected([testAnnotation1.id, testAnnotation2.id]);
      expect(selectionState.isEmpty()).toBe(false);
      expect(selectionState.isSelected(testAnnotation1)).toBe(true);
      expect(selectionState.isSelected(testAnnotation2)).toBe(true);
      expect(selectionState.isSelected(testAnnotation3)).toBe(false);
    });
    
  });

});
