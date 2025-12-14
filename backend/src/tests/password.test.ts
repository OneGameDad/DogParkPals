import { jest, expect, describe, test, beforeAll } from '@jest/globals';
import { hashPassword, verifyPassword } from '../utils/password';

describe('Password Utilities', () => {
  const plainPassword = 'SecureP@ssw0rd!';
  let hashedPassword: string;

  beforeAll(async () => {
    hashedPassword = await hashPassword(plainPassword);
  });

  test('hashPassword returns a different value than the plain password', async () => {
    expect(hashedPassword).not.toBe(plainPassword);
  });

  test('verifyPassword returns true for the correct password', async () => {
    const isMatch = await verifyPassword(plainPassword, hashedPassword);
    expect(isMatch).toBe(true);
  });

  test('verifyPassword returns false for an incorrect password', async () => {
    const isMatch = await verifyPassword('WrongPassword', hashedPassword);
    expect(isMatch).toBe(false);
  });
});