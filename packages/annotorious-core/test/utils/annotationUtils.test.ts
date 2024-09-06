import { describe, it, expect } from 'vitest';
import { type Annotation, reviveDates } from '../../src';

const annotation1 = {
  id: '1',
  target: {
    annotation: '1',
    selector: {},
    creator: { id: 'user1' },
    created: '2024-09-06T06:42:00Z',
    updated: '2024-09-06T06:52:00Z'
  },
  bodies: [{ 
    id: 'body-1', 
    annotation: '1', 
    value: 'body-1', 
    creator: { id: 'user1' }, 
    created: '2024-09-06T06:42:00Z',
    updated: '2024-09-06T06:52:00Z'
  }]
};

const annotation2 = {
  id: '1',
  target: {
    annotation: '1',
    selector: {},
    creator: { id: 'user1' },
  },
  bodies: [{ 
    id: 'body-1', 
    annotation: '1', 
    value: 'body-1', 
    creator: { id: 'user1' }, 
    created: '2024-09-06T06:42:00Z' 
  }]
};

const annotation3 = {
  id: '1',
  target: {
    annotation: '1',
    selector: {},
    creator: { id: 'user1' },
    created: '2024-09-06T06:42:00Z'
  },
  bodies: [{ 
    id: 'body-1', 
    annotation: '1', 
    value: 'body-1', 
    creator: { id: 'user1' }, 
  }]
};

const annotation4 = {
  id: '1',
  target: {
    annotation: '1',
    selector: {},
  },
  bodies: [{ 
    id: 'body-1', 
    annotation: '1', 
    value: 'body-1', 
  }]
};

describe('reviveDates', () => {

  it('should revive body and target timestamps', () => {
    const revived = reviveDates(annotation1 as unknown as Annotation);

    expect(revived.target.created).toBeInstanceOf(Date);
    expect(revived.target.updated).toBeInstanceOf(Date);

    expect(revived.bodies.length).toBe(1);
    expect(revived.bodies[0].created).toBeInstanceOf(Date);
    expect(revived.bodies[0].updated).toBeInstanceOf(Date);
    
    expect(revived.target.created?.toISOString()).toBe('2024-09-06T06:42:00.000Z');
    expect(revived.bodies[0].created?.toISOString()).toBe('2024-09-06T06:42:00.000Z');
  })

  it('should ignore missing timestamps in the target', () => {
    const revived = reviveDates(annotation2 as unknown as Annotation);

    expect(revived.target.created).toBeUndefined();
    expect(revived.target.updated).toBeUndefined();

    expect(revived.bodies.length).toBe(1);
    expect(revived.bodies[0].created).toBeInstanceOf(Date);

    expect(revived.bodies[0].created?.toISOString()).toBe('2024-09-06T06:42:00.000Z');
  })

  it('should ignore missing timestamps in the body', () => {
    const revived = reviveDates(annotation3 as unknown as Annotation);

    expect(revived.target.created).toBeInstanceOf(Date);
    expect(revived.target.updated).toBeUndefined();

    expect(revived.bodies.length).toBe(1);
    expect(revived.bodies[0].created).toBeUndefined();
    expect(revived.bodies[0].updated).toBeUndefined();
    
    expect(revived.target.created?.toISOString()).toBe('2024-09-06T06:42:00.000Z');
  })

  it('should ignore missing timestamps in body and target', () => {
    const revived = reviveDates(annotation4 as unknown as Annotation);

    expect(revived.target.created).toBeUndefined();
    expect(revived.target.updated).toBeUndefined();

    expect(revived.bodies.length).toBe(1);
    expect(revived.bodies[0].created).toBeUndefined();
    expect(revived.bodies[0].updated).toBeUndefined();
  })

});

