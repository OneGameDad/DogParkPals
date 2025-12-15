import { describe, test, expect } from '@jest/globals';
import { sanitizeLogData } from '../utils/logSanitizer';

describe('Log Sanitizer', () => {
  describe('sanitizeLogData', () => {
    test('redacts password field', () => {
      const data = { username: 'testuser', password: 'secret123' };
      const sanitized = sanitizeLogData(data);

      expect(sanitized.username).toBe('testuser');
      expect(sanitized.password).toBe('[REDACTED]');
    });

    test('redacts password_hash field', () => {
      const data = { 
        id: 1, 
        email: 'test@example.com', 
        password_hash: 'hashed_password_value' 
      };
      const sanitized = sanitizeLogData(data);

      expect(sanitized.id).toBe(1);
      expect(sanitized.email).toBe('test@example.com');
      expect(sanitized.password_hash).toBe('[REDACTED]');
    });

    test('redacts multiple sensitive fields', () => {
      const data = {
        username: 'testuser',
        password: 'secret123',
        token: 'abc123token',
        apiKey: 'key123',
        email: 'test@example.com',
      };
      const sanitized = sanitizeLogData(data);

      expect(sanitized.username).toBe('testuser');
      expect(sanitized.email).toBe('test@example.com');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.apiKey).toBe('[REDACTED]');
    });

    test('handles nested objects', () => {
      const data = {
        user: {
          username: 'testuser',
          password: 'secret123',
          email: 'test@example.com',
        },
        metadata: {
          timestamp: '2025-01-01',
        },
      };
      const sanitized = sanitizeLogData(data);

      expect(sanitized.user.username).toBe('testuser');
      expect(sanitized.user.email).toBe('test@example.com');
      expect(sanitized.user.password).toBe('[REDACTED]');
      expect(sanitized.metadata.timestamp).toBe('2025-01-01');
    });

    test('handles arrays of objects', () => {
      const data = [
        { username: 'user1', password: 'pass1' },
        { username: 'user2', password: 'pass2' },
      ];
      const sanitized = sanitizeLogData(data);

      expect(sanitized[0].username).toBe('user1');
      expect(sanitized[0].password).toBe('[REDACTED]');
      expect(sanitized[1].username).toBe('user2');
      expect(sanitized[1].password).toBe('[REDACTED]');
    });

    test('handles deeply nested structures', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              username: 'testuser',
              password: 'secret123',
            },
          },
        },
      };
      const sanitized = sanitizeLogData(data);

      expect(sanitized.level1.level2.level3.username).toBe('testuser');
      expect(sanitized.level1.level2.level3.password).toBe('[REDACTED]');
    });

    test('does not modify original object', () => {
      const data = { username: 'testuser', password: 'secret123' };
      const originalPassword = data.password;
      
      sanitizeLogData(data);

      expect(data.password).toBe(originalPassword);
    });

    test('handles null values', () => {
      const sanitized = sanitizeLogData(null);
      expect(sanitized).toBeNull();
    });

    test('handles undefined values', () => {
      const sanitized = sanitizeLogData(undefined);
      expect(sanitized).toBeUndefined();
    });

    test('handles primitive values', () => {
      expect(sanitizeLogData('string')).toBe('string');
      expect(sanitizeLogData(123)).toBe(123);
      expect(sanitizeLogData(true)).toBe(true);
    });

    test('redacts tokens with different casing', () => {
      const data = {
        accessToken: 'token1',
        AccessToken: 'token2',
        access_token: 'token3',
        ACCESSTOKEN: 'token4',
      };
      const sanitized = sanitizeLogData(data);

      expect(sanitized.accessToken).toBe('[REDACTED]');
      expect(sanitized.AccessToken).toBe('[REDACTED]');
      expect(sanitized.access_token).toBe('[REDACTED]');
      expect(sanitized.ACCESSTOKEN).toBe('[REDACTED]');
    });

    test('redacts refreshToken', () => {
      const data = { refreshToken: 'refresh123' };
      const sanitized = sanitizeLogData(data);

      expect(sanitized.refreshToken).toBe('[REDACTED]');
    });

    test('redacts secret and privateKey', () => {
      const data = {
        secret: 'secret123',
        privateKey: 'key123',
        private_key: 'key456',
      };
      const sanitized = sanitizeLogData(data);

      expect(sanitized.secret).toBe('[REDACTED]');
      expect(sanitized.privateKey).toBe('[REDACTED]');
      expect(sanitized.private_key).toBe('[REDACTED]');
    });

    test('redacts credit card information', () => {
      const data = {
        creditCard: '4111-1111-1111-1111',
        credit_card: '4111-1111-1111-1111',
      };
      const sanitized = sanitizeLogData(data);

      expect(sanitized.creditCard).toBe('[REDACTED]');
      expect(sanitized.credit_card).toBe('[REDACTED]');
    });

    test('redacts ssn and social security number', () => {
      const data = {
        ssn: '123-45-6789',
        socialSecurityNumber: '987-65-4321',
      };
      const sanitized = sanitizeLogData(data);

      expect(sanitized.ssn).toBe('[REDACTED]');
      expect(sanitized.socialSecurityNumber).toBe('[REDACTED]');
    });

    test('preserves non-sensitive fields in complex objects', () => {
      const data = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'secret123',
        profile: {
          firstName: 'Test',
          lastName: 'User',
          age: 30,
        },
        preferences: {
          theme: 'dark',
          apiKey: 'key123',
        },
      };
      const sanitized = sanitizeLogData(data);

      expect(sanitized.id).toBe(1);
      expect(sanitized.username).toBe('testuser');
      expect(sanitized.email).toBe('test@example.com');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.profile.firstName).toBe('Test');
      expect(sanitized.profile.lastName).toBe('User');
      expect(sanitized.profile.age).toBe(30);
      expect(sanitized.preferences.theme).toBe('dark');
      expect(sanitized.preferences.apiKey).toBe('[REDACTED]');
    });

    test('handles empty objects', () => {
      const data = {};
      const sanitized = sanitizeLogData(data);

      expect(sanitized).toEqual({});
    });

    test('handles empty arrays', () => {
      const data: any[] = [];
      const sanitized = sanitizeLogData(data);

      expect(sanitized).toEqual([]);
    });

    test('handles mixed array with primitives and objects', () => {
      const data = [
        'string',
        123,
        { username: 'user1', password: 'pass1' },
        null,
      ];
      const sanitized = sanitizeLogData(data);

      expect(sanitized[0]).toBe('string');
      expect(sanitized[1]).toBe(123);
      expect(sanitized[2].username).toBe('user1');
      expect(sanitized[2].password).toBe('[REDACTED]');
      expect(sanitized[3]).toBeNull();
    });

    test('redacts fields with password in compound names', () => {
      const data = {
        newPassword: 'newpass123',
        oldPassword: 'oldpass123',
        confirmPassword: 'confirmpass123',
        passwordHash: 'hash123',
      };
      const sanitized = sanitizeLogData(data);

      expect(sanitized.newPassword).toBe('[REDACTED]');
      expect(sanitized.oldPassword).toBe('[REDACTED]');
      expect(sanitized.confirmPassword).toBe('[REDACTED]');
      expect(sanitized.passwordHash).toBe('[REDACTED]');
    });

    test('handles Date objects', () => {
      const date = new Date('2025-01-01');
      const data = {
        createdAt: date,
        password: 'secret123',
      };
      const sanitized = sanitizeLogData(data);

      expect(sanitized.createdAt).toEqual(date);
      expect(sanitized.password).toBe('[REDACTED]');
    });

    test('handles objects with numeric keys', () => {
      const data = {
        '0': 'value0',
        '1': 'value1',
        password: 'secret123',
      };
      const sanitized = sanitizeLogData(data);

      expect(sanitized['0']).toBe('value0');
      expect(sanitized['1']).toBe('value1');
      expect(sanitized.password).toBe('[REDACTED]');
    });

    test('handles Error objects', () => {
      const error = new Error('Test error');
      const data = {
        error,
        password: 'secret123',
      };
      const sanitized = sanitizeLogData(data);

      // Error object should be preserved as-is (it's an object but has special handling)
      expect(sanitized.error).toBeDefined();
      expect(sanitized.password).toBe('[REDACTED]');
    });
  });
});
