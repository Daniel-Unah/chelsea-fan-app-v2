import { describe, expect, it } from 'vitest';

import {
  validateBio,
  validateDisplayName,
  validateEmail,
  validatePassword,
  validateUsername,
} from './validation';

describe('validateUsername', () => {
  it('accepts a normal username', () => {
    expect(validateUsername('dan_1')).toBeNull();
  });

  it('rejects short, long, and symbolic usernames', () => {
    expect(validateUsername('ab')).toMatch(/3 characters/);
    expect(validateUsername('a'.repeat(25))).toMatch(/24 characters/);
    expect(validateUsername('dan blue')).toMatch(/letters, numbers/);
  });
});

describe('validateDisplayName', () => {
  it('requires a display name within 40 characters', () => {
    expect(validateDisplayName('  ')).toMatch(/required/);
    expect(validateDisplayName('Daniel')).toBeNull();
    expect(validateDisplayName('d'.repeat(41))).toMatch(/40 characters/);
  });
});

describe('validateBio', () => {
  it('allows an empty bio and rejects a long one', () => {
    expect(validateBio('')).toBeNull();
    expect(validateBio('a'.repeat(161))).toMatch(/160 characters/);
  });
});

describe('account fields', () => {
  it('checks email and password before signup', () => {
    expect(validateEmail('not-an-email')).toMatch(/email/);
    expect(validateEmail('fan@example.com')).toBeNull();
    expect(validatePassword('short')).toMatch(/6 characters/);
    expect(validatePassword('long-enough')).toBeNull();
  });
});
