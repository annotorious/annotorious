import { describe, it, expect } from 'vitest';
import { createAnonymousGuest } from '../../src/model/User';

describe('createAnonymousGuest', () => {

  it('should create a valid Guest user', () => {
    const guest = createAnonymousGuest();

    expect(guest.isGuest).toBe(true);
    expect(guest.id).toBeDefined();
  });

});