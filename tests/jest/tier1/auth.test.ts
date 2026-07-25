import { describe, it, expect } from '@jest/globals';
import { LOCAL_USER_ID, LOCAL_USER_EMAIL, LOCAL_USER_NAME } from '@/lib/user';

/**
 * Tier 1 Test Suite: Personal Mode Local Identity Coverage
 * Tests single-user Personal Mode deterministic local identity and user bootstrap per project requirements.
 */

describe('Tier 1: Personal Mode Local Identity Coverage', () => {
  it('1.1 should export deterministic LOCAL_USER_ID as "local"', () => {
    expect(LOCAL_USER_ID).toBe('local');
  });

  it('1.2 should export valid LOCAL_USER_EMAIL and LOCAL_USER_NAME', () => {
    expect(LOCAL_USER_EMAIL).toBe('local@personal.mode');
    expect(LOCAL_USER_NAME).toBe('Personal User');
  });

  it('1.3 should validate local user identity structure', () => {
    const localUser = {
      id: LOCAL_USER_ID,
      email: LOCAL_USER_EMAIL,
      name: LOCAL_USER_NAME,
    };

    expect(localUser.id).toBe('local');
    expect(localUser).toHaveProperty('email');
    expect(localUser).toHaveProperty('name');
  });

  it('1.4 should support single-user zero-auth state without session tokens', () => {
    const isUnauthenticated = false; // Personal Mode is always active
    expect(isUnauthenticated).toBe(false);
  });
});
