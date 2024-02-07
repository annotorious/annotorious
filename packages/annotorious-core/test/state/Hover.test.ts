import { beforeEach, describe, it, expect,vi } from 'vitest';
import { type Store, createStore, createHoverState } from '../../src/state';
import type { Annotation } from '../../src/model';

const testAnnotation: Annotation = {
  id: 'test-id-1',
  targets: [],
  bodies: [],
};

describe('createHoverState', () => {
  let store: Store<Annotation>;
  
  let hoverState: ReturnType<typeof createHoverState>;

  beforeEach(() => {
    store = createStore<Annotation>();
    store.addAnnotation(testAnnotation);

    hoverState = createHoverState(store);
  });

  it('should update the selection when setting', () => {
    let hover: string | undefined;

    const mockObserver = vi.fn(id => hover = id);
    hoverState.subscribe(mockObserver);

    hoverState.set(testAnnotation.id);

    expect(mockObserver).toHaveBeenCalled();
    expect(hover).toBe(testAnnotation.id);
  });

  it('should remove the hover when the annotation is deleted', () => {
    hoverState.set(testAnnotation.id);

    let hover: string | undefined;

    const mockObserver = vi.fn(id => hover = id);
    hoverState.subscribe(mockObserver);

    store.deleteAnnotation(testAnnotation);

    expect(mockObserver).toHaveBeenCalled();
    expect(hover).toBeUndefined();
  });

});
