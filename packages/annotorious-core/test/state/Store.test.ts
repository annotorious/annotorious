import { describe, it, expect, vi } from 'vitest';
import { dequal } from 'dequal/lite';
import { createStore, Origin } from '../../src/state';
import type { Annotation } from 'src';

describe('store', () => {
  const id1 = 'annotation-1';
  const id2 = 'annotation-2';

  const annotation = {
    id: id1,
    target: {
      annotation: id1,
      selector: {},
    },
    bodies: [
      {
        id: 'body-1',
        annotation: id1,
        value: 'This is the body text',
      },
    ],
  };

  const lazyAnnotation1 = {
    id: id2,
    target: {
      selector: {}
    }
  }

  const lazyAnnotation2 = {
    target: {
      selector: {}
    }
  }

  it('should properly run addAnnotation', () => {
    const store = createStore();
    store.addAnnotation(annotation);
    expect(dequal(store.getAnnotation(id1), annotation)).toBe(true);
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
    expect(store.all().length).toBe(1);

    const updated = store.getAnnotation('annotation-2')!;
    expect(updated.id).toBe('annotation-2');
    expect(updated.target.annotation).toBe('annotation-2');
    expect(updated.bodies[0].annotation).toBe('annotation-2');
  })

  it('should properly run addBody', () => {
    const store = createStore();
    store.addAnnotation(annotation);

    const newBody = {
      id: 'body-2',
      annotation: id1,
      value: 'This is the second body text',
    };
    store.addBody(newBody);

    const updatedAnnotation = store.getAnnotation(id1);

    expect(updatedAnnotation?.bodies.length === 2);
    expect(updatedAnnotation?.bodies.map(b => b.id)).toContain('body-2');
  });

  it('should properly run bulkAddAnnotation', () => {
    const store = createStore();

    const newAnnotations = [
      annotation,
      {
        id: 'annotation-2',
        target: {
          annotation: 'annotation-2',
          selector: {},
        },
        bodies: [],
      },
    ];

    store.bulkAddAnnotations(newAnnotations);

    expect(store.getAnnotation('annotation-1')).toBeDefined();
    expect(store.getAnnotation('annotation-2')).toBeDefined();
  });

  it('should properly run deleteAnnotation', () => {
    const store = createStore();
    store.addAnnotation(annotation);

    expect(store.getAnnotation(id1)).toBeDefined();

    store.deleteAnnotation(id1);
    expect(store.getAnnotation(id1)).toBeUndefined();
  });

  it('should properly run deleteBody', () => {
    const store = createStore();
    store.addAnnotation(annotation);

    const bodyToDelete = annotation.bodies[0];
    store.deleteBody(bodyToDelete);

    const updatedAnnotation = store.getAnnotation(id1);
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

    const updatedAnnotation = store.getAnnotation(id1);

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
      target: {
        annotation: 'annotation-2',
        selector: {},
      },
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
  
  it('should properly handle annotations without `bodies` and `annotation` fields', () => {
    const store = createStore();
    store.addAnnotation(lazyAnnotation1 as unknown as Annotation);

    const inserted = store.getAnnotation(id2);

    expect(inserted?.id).toBe(id2);
    expect(inserted?.bodies).toBeDefined();
    expect(inserted?.bodies.length).toBe(0);
    expect(inserted?.target.annotation).toBe(id2);
  });

  it('should auto-generate an ID for annotations that don\'t have one', () => {
    const store = createStore();
    store.addAnnotation(lazyAnnotation2 as unknown as Annotation);

    expect(store.all().length).toBe(1);

    const inserted = store.all()[0];

    const autoId = inserted.id;

    expect(autoId).toBeDefined()
    expect(inserted?.bodies).toBeDefined();
    expect(inserted?.bodies.length).toBe(0);
    expect(inserted?.target.annotation).toBe(autoId);
  });

  describe('syncAnnotations', () => {
    const existing1 = {
      id: 'sync-1',
      target: { annotation: 'sync-1', selector: {} },
      bodies: [],
    };

    const existing2 = {
      id: 'sync-2',
      target: { annotation: 'sync-2', selector: {} },
      bodies: [],
    };

    it('should emit created for new annotations', () => {
      const store = createStore();
      const mockObserver = vi.fn();
      store.observe(mockObserver);

      store.syncAnnotations([existing1]);

      expect(store.getAnnotation('sync-1')).toBeDefined();
      expect(mockObserver.mock.calls[0][0].changes.created).toHaveLength(1);
      expect(mockObserver.mock.calls[0][0].changes.updated).toHaveLength(0);
      expect(mockObserver.mock.calls[0][0].changes.deleted).toHaveLength(0);
    });

    it('should emit updated for annotations present in both store and input', () => {
      const store = createStore();
      store.bulkAddAnnotations([existing1, existing2]);

      const mockObserver = vi.fn();
      store.observe(mockObserver);

      const updated1 = { ...existing1, bodies: [{ id: 'body-new', annotation: 'sync-1', value: 'hello' }] };
      store.syncAnnotations([updated1, existing2]);

      const changes = mockObserver.mock.calls[0][0].changes;
      expect(changes.created).toHaveLength(0);
      expect(changes.updated).toHaveLength(2);
      expect(changes.updated.map((u: { newValue: Annotation }) => u.newValue.id)).toContain('sync-1');
      expect(changes.deleted).toHaveLength(0);
    });

    it('should emit deleted for annotations only in store', () => {
      const store = createStore();
      store.bulkAddAnnotations([existing1, existing2]);

      const mockObserver = vi.fn();
      store.observe(mockObserver);

      store.syncAnnotations([existing1]);

      const changes = mockObserver.mock.calls[0][0].changes;
      expect(changes.created).toHaveLength(0);
      expect(changes.updated).toHaveLength(1);
      expect(changes.deleted).toHaveLength(1);
      expect(changes.deleted[0].id).toBe('sync-2');
      expect(store.getAnnotation('sync-2')).toBeUndefined();
    });

    it('should emit a combined changeset for mixed create/update/delete', () => {
      const store = createStore();
      store.bulkAddAnnotations([existing1, existing2]);

      const mockObserver = vi.fn();
      store.observe(mockObserver);

      const newAnnotation = { id: 'sync-3', target: { annotation: 'sync-3', selector: {} }, bodies: [] };
      const updatedExisting1 = { ...existing1, bodies: [{ id: 'b1', annotation: 'sync-1', value: 'x' }] };

      store.syncAnnotations([updatedExisting1, newAnnotation]);

      const changes = mockObserver.mock.calls[0][0].changes;
      expect(changes.created.map((a: Annotation) => a.id)).toContain('sync-3');
      expect(changes.updated.map((u: { newValue: Annotation }) => u.newValue.id)).toContain('sync-1');
      expect(changes.deleted.map((a: Annotation) => a.id)).toContain('sync-2');
    });
  });

});
