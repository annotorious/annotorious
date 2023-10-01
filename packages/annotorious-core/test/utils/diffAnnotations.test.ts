import { describe, it, expect } from 'vitest';
import { Annotation, diffAnnotations } from '../../src';

const created = new Date();

const annotation1: Annotation = {
  id: '1',
  target: {
    annotation: '1',
    selector: {},
    creator: { id: 'user1' },
    created
  },
  bodies: [
    { id: 'body-1', annotation: '1', value: 'body-1', creator: { id: 'user1' }, created },
    { id: 'body-2', annotation: '1', value: 'body-2', creator: { id: 'user2' }, created }
  ]
};

const annotation2: Annotation = {
  id: '1',
  target: {
    annotation: '1',
    selector: {},
    creator: { id: 'user1' },
    created: created
  },
  bodies: [
    { id: 'body-1', annotation: '1', value: 'body-1-changed', creator: { id: 'user1' }, created },
    { id: 'body-3', annotation: '1', value: 'body-3', creator: { id: 'user3' }, created }
  ]
};

describe('diffAnnotations', () => {

  it('should compute proper diffs', () => {
    const diff = diffAnnotations(annotation1, annotation2);

    expect(diff.bodiesCreated.length).toBe(1);
    expect(diff.bodiesCreated[0].id).toBe('body-3');
    expect(diff.bodiesCreated[0].value).toBe('body-3');
    expect(diff.bodiesDeleted.length).toBe(1);
    expect(diff.bodiesDeleted[0].id).toBe('body-2');
    expect(diff.bodiesDeleted[0].value).toBe('body-2');
    expect(diff.bodiesUpdated.length).toBe(1);
    expect(diff.bodiesUpdated[0].newBody.id).toBe('body-1');
    expect(diff.bodiesUpdated[0].newBody.value).toBe('body-1-changed');
    expect(diff.targetUpdated).toBe(undefined);
  })

});

