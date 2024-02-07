import { describe, it, expect, vi } from 'vitest';
import { dequal } from 'dequal/lite';
import { createStore, Origin } from '../../src/state';

describe('store', () => {
  const id = 'annotation-1';

  const annotation = {
    id,
    targets: [
      {
        id: 'target-1',
        annotation: id,
        selector: {},
      }
    ],
    bodies: [
      {
        id: 'body-1',
        annotation: id,
        value: 'This is the body text',
      },
    ],
  };

  it('should properly run addAnnotation', () => {
    const store = createStore();
    store.addAnnotation(annotation);
    expect(dequal(store.getAnnotation(id), annotation)).toBe(true);
  });

  it('should properly run updateAnnotation', () => {
    const store = createStore();
    store.addAnnotation(annotation);

    expect(dequal(store.getAnnotation(annotation.id), annotation)).toBe(true);

    const withChangedBodies = {
      ...annotation,
      bodies: []
    };

    store.updateAnnotation(withChangedBodies);

    expect(dequal(store.getAnnotation(annotation.id), annotation)).toBe(false);
    expect(dequal(store.getAnnotation(annotation.id), withChangedBodies)).toBe(true);
    expect(store.all().length).toBe(1);
  });

  it('should properly run updateAnnotation with ID change', () => {
    const store = createStore();
    store.addAnnotation(annotation);

    const withChangedId = {
      ...annotation,
      id: 'annotation-2'
    };

    store.updateAnnotation(annotation.id, withChangedId);

    expect(store.getAnnotation(annotation.id)).toBeUndefined();
    expect(dequal(store.getAnnotation('annotation-2'), withChangedId)).toBe(true);
    expect(store.all().length).toBe(1);
  })

  it('should properly run addBody', () => {
    const store = createStore();
    store.addAnnotation(annotation);

    const newBody = {
      id: 'body-2',
      annotation: id,
      value: 'This is the second body text',
    };
    store.addBody(newBody);

    const updatedAnnotation = store.getAnnotation(id);

    expect(updatedAnnotation?.bodies.length === 2);
    expect(updatedAnnotation?.bodies.map(b => b.id)).toContain('body-2');
  });

  it('should properly run bulkAddAnnotation', () => {
    const store = createStore();

    const newAnnotations = [
      annotation,
      {
        id: 'annotation-2',
        targets: [
          {
            id: 'target-2',
            annotation: 'annotation-2',
            selector: {},
          }
        ],
        bodies: [],
      },
    ];

    store.bulkAddAnnotation(newAnnotations);

    expect(store.getAnnotation('annotation-1')).toBeDefined();
    expect(store.getAnnotation('annotation-2')).toBeDefined();
  });

  it('should properly run deleteAnnotation', () => {
    const store = createStore();
    store.addAnnotation(annotation);

    expect(store.getAnnotation(id)).toBeDefined();

    store.deleteAnnotation(id);
    expect(store.getAnnotation(id)).toBeUndefined();
  });

  it('should properly run deleteBody', () => {
    const store = createStore();
    store.addAnnotation(annotation);

    const bodyToDelete = annotation.bodies[0];
    store.deleteBody(bodyToDelete);

    const updatedAnnotation = store.getAnnotation(id);
    expect(updatedAnnotation?.bodies.length).toBe(0);
  });

  it('should properly run clear', () => {
    const store = createStore();
    store.addAnnotation(annotation);

    const retrievedBefore = store.getAnnotation(annotation.id);
    expect(retrievedBefore!.id).toBe(annotation.id);

    store.clear();

    const retrievedAfter = store.getAnnotation(annotation.id);

    expect(retrievedAfter).toBeUndefined();
    expect(store.all().length).toBe(0);
  });

  it('should properly run updateBody', () => {
    const store = createStore();
    store.addAnnotation(annotation);

    const oldBody = annotation.bodies[0];

    const newBody = {
      ...oldBody,
      value: 'This is the updated body text',
    };
    store.updateBody(oldBody, newBody);

    const updatedAnnotation = store.getAnnotation(id);

    expect(updatedAnnotation?.bodies.length).toBe(1);
    expect(updatedAnnotation?.bodies[0].value).toBe('This is the updated body text');
  });

  it('should properly observe and unobserve', () => {
    const store = createStore();
    const mockObserver = vi.fn()

    store.observe(mockObserver);
    store.addAnnotation(annotation);

    expect(mockObserver).toHaveBeenCalled();

    mockObserver.mockClear();
    store.unobserve(mockObserver);
    
    store.addAnnotation({
      id: 'annotation-2',
      targets: [
        {
          id: 'target-2',
          annotation: 'annotation-2',
          selector: {},
        }
      ],
      bodies: [],
    });

    expect(mockObserver).not.toHaveBeenCalled();
  });

  it('should emit with origin = Origin.LOCAL', () => {
    const store = createStore();
    const mockObserver = vi.fn();

    store.observe(mockObserver);
    store.addAnnotation(annotation);

    expect(mockObserver).toHaveBeenCalled();
    expect(mockObserver.mock.calls[0][0].origin).toBe(Origin.LOCAL);
  });
  
});
