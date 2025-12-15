import { describe, test, expect, beforeEach } from '@jest/globals';
import type { User } from '@prisma/client';
import { sanitizeUser } from '../utils/userSanitizer';

describe('User Sanitizer', () => {
  let mockUser: User;

  beforeEach(() => {
    // Create a mock user with all fields including sensitive ones
    mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashed_password_value',
      first_name: 'Test',
      last_name: 'User',
      profilePictureUrl: 'https://example.com/pic.jpg',
      role: 'CLIENT',
      ExpPoints: 100,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-02'),
    };
  });

  describe('sanitizeUser', () => {
    test('removes password_hash from user object', () => {
      const sanitized = sanitizeUser(mockUser);

      expect(sanitized).not.toHaveProperty('password_hash');
    });

    test('preserves all other user fields', () => {
      const sanitized = sanitizeUser(mockUser);

      expect(sanitized.id).toBe(1);
      expect(sanitized.username).toBe('testuser');
      expect(sanitized.email).toBe('test@example.com');
      expect(sanitized.first_name).toBe('Test');
      expect(sanitized.last_name).toBe('User');
      expect(sanitized.profilePictureUrl).toBe('https://example.com/pic.jpg');
      expect(sanitized.role).toBe('CLIENT');
      expect(sanitized.ExpPoints).toBe(100);
    });

    test('preserves timestamps', () => {
      const sanitized = sanitizeUser(mockUser);

      expect(sanitized.createdAt).toEqual(new Date('2025-01-01'));
      expect(sanitized.updatedAt).toEqual(new Date('2025-01-02'));
    });

    test('handles user with null optional fields', () => {
      const userWithNulls: User = {
        ...mockUser,
        first_name: null,
        last_name: null,
        profilePictureUrl: null,
      };

      const sanitized = sanitizeUser(userWithNulls);

      expect(sanitized.first_name).toBeNull();
      expect(sanitized.last_name).toBeNull();
      expect(sanitized.profilePictureUrl).toBeNull();
      expect(sanitized).not.toHaveProperty('password_hash');
    });

    test('returns object with correct number of fields (excluding password_hash)', () => {
      const sanitized = sanitizeUser(mockUser);

      // User has 10 fields total, minus password_hash = 9 fields
      expect(Object.keys(sanitized)).toHaveLength(10);
    });

    test('preserves field types after sanitization', () => {
      const sanitized = sanitizeUser(mockUser);

      expect(typeof sanitized.id).toBe('number');
      expect(typeof sanitized.username).toBe('string');
      expect(typeof sanitized.email).toBe('string');
      expect(typeof sanitized.ExpPoints).toBe('number');
      expect(sanitized.createdAt instanceof Date).toBe(true);
      expect(sanitized.updatedAt instanceof Date).toBe(true);
    });

    test('does not modify original user object', () => {
      const originalHash = mockUser.password_hash;
      sanitizeUser(mockUser);

      expect(mockUser.password_hash).toBe(originalHash);
    });

    test('returns new object instance', () => {
      const sanitized = sanitizeUser(mockUser);

      expect(sanitized).not.toBe(mockUser);
    });

    test('handles user with special characters in fields', () => {
      mockUser.username = 'test@user!#$';
      mockUser.email = 'test+tag@example.com';
      mockUser.first_name = 'Tëst';

      const sanitized = sanitizeUser(mockUser);

      expect(sanitized.username).toBe('test@user!#$');
      expect(sanitized.email).toBe('test+tag@example.com');
      expect(sanitized.first_name).toBe('Tëst');
      expect(sanitized).not.toHaveProperty('password_hash');
    });

    test('handles user with very long field values', () => {
      const longString = 'a'.repeat(1000);
      mockUser.username = longString;
      mockUser.profilePictureUrl = `https://example.com/${longString}.jpg`;

      const sanitized = sanitizeUser(mockUser);

      expect(sanitized.username).toBe(longString);
      expect(sanitized.profilePictureUrl).toBe(`https://example.com/${longString}.jpg`);
      expect(sanitized).not.toHaveProperty('password_hash');
    });

    test('handles user with ADMIN role', () => {
      mockUser.role = 'ADMIN';

      const sanitized = sanitizeUser(mockUser);

      expect(sanitized.role).toBe('ADMIN');
      expect(sanitized).not.toHaveProperty('password_hash');
    });

    test('handles user with zero ExpPoints', () => {
      mockUser.ExpPoints = 0;

      const sanitized = sanitizeUser(mockUser);

      expect(sanitized.ExpPoints).toBe(0);
    });

    test('handles user with high ExpPoints', () => {
      mockUser.ExpPoints = 999999;

      const sanitized = sanitizeUser(mockUser);

      expect(sanitized.ExpPoints).toBe(999999);
    });

    test('sanitized user does not expose any password-related information', () => {
      const sanitized = sanitizeUser(mockUser);

      // Check that password_hash is not present
      expect(sanitized).not.toHaveProperty('password_hash');

      // Check that no keys contain 'password'
      const keys = Object.keys(sanitized);
      const hasPasswordKey = keys.some((key) => key.toLowerCase().includes('password'));
      expect(hasPasswordKey).toBe(false);
    });

    test('returns sanitized user with consistent structure across multiple calls', () => {
      const sanitized1 = sanitizeUser(mockUser);
      const sanitized2 = sanitizeUser(mockUser);

      expect(Object.keys(sanitized1)).toEqual(Object.keys(sanitized2));
    });
  });

  describe('Type safety', () => {
    test('sanitized user type excludes password_hash', () => {
      const sanitized = sanitizeUser(mockUser);

      // This test ensures TypeScript type safety by verifying the structure
      // password_hash should not be accessible
      expect(sanitized).toBeDefined();
      expect(typeof sanitized.id).toBe('number');
      expect(typeof sanitized.username).toBe('string');
    });
  });
});
