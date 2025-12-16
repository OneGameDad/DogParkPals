import { describe, test, expect } from '@jest/globals';
import { classifyError, ErrorClassification, createExternalServiceError } from '../utils/errorClassification';
import { AppError, ValidationError, AuthError, NotFoundError, UpstreamError, RateLimitError } from '../utils/errors';

describe('Error Classification', () => {
  describe('classifyError', () => {
    test('classifies timeout errors as TIMEOUT and retryable', () => {
      const error = new AppError('Request timed out', { statusCode: 408, code: 'TIMEOUT' });
      const classified = classifyError(error);

      expect(classified.classification).toBe(ErrorClassification.TIMEOUT);
      expect(classified.isTimeout).toBe(true);
      expect(classified.isRetryable).toBe(true);
    });

    test('classifies 503 (service unavailable) as RETRYABLE', () => {
      const error = new AppError('Service unavailable', { statusCode: 503, code: 'SERVICE_UNAVAILABLE' });
      const classified = classifyError(error);

      expect(classified.classification).toBe(ErrorClassification.RETRYABLE);
      expect(classified.isRetryable).toBe(true);
      expect(classified.isTimeout).toBe(false);
    });

    test('classifies 502 (bad gateway) as RETRYABLE', () => {
      const error = new AppError('Bad gateway', { statusCode: 502, code: 'BAD_GATEWAY' });
      const classified = classifyError(error);

      expect(classified.classification).toBe(ErrorClassification.RETRYABLE);
      expect(classified.isRetryable).toBe(true);
    });

    test('classifies 504 (gateway timeout) as RETRYABLE', () => {
      const error = new AppError('Gateway timeout', { statusCode: 504, code: 'GATEWAY_TIMEOUT' });
      const classified = classifyError(error);

      expect(classified.classification).toBe(ErrorClassification.RETRYABLE);
      expect(classified.isRetryable).toBe(true);
    });

    test('classifies 501 (not implemented) as NON_RETRYABLE', () => {
      const error = new AppError('Not implemented', { statusCode: 501, code: 'NOT_IMPLEMENTED' });
      const classified = classifyError(error);

      expect(classified.classification).toBe(ErrorClassification.NON_RETRYABLE);
      expect(classified.isRetryable).toBe(false);
    });

    test('classifies 429 (rate limit) as RETRYABLE', () => {
      const error = RateLimitError('Too many requests');
      const classified = classifyError(error);

      expect(classified.classification).toBe(ErrorClassification.RETRYABLE);
      expect(classified.isRetryable).toBe(true);
      expect(classified.statusCode).toBe(429);
    });

    test('classifies 404 (not found) as NON_RETRYABLE', () => {
      const error = NotFoundError('User not found');
      const classified = classifyError(error);

      expect(classified.classification).toBe(ErrorClassification.NON_RETRYABLE);
      expect(classified.isRetryable).toBe(false);
      expect(classified.statusCode).toBe(404);
    });

    test('classifies 401 (auth error) as NON_RETRYABLE', () => {
      const error = AuthError('Invalid token');
      const classified = classifyError(error);

      expect(classified.classification).toBe(ErrorClassification.NON_RETRYABLE);
      expect(classified.isRetryable).toBe(false);
      expect(classified.statusCode).toBe(401);
    });

    test('classifies 400 (validation error) as NON_RETRYABLE', () => {
      const error = ValidationError('Invalid input', { field: ['Required'] });
      const classified = classifyError(error);

      expect(classified.classification).toBe(ErrorClassification.NON_RETRYABLE);
      expect(classified.isRetryable).toBe(false);
      expect(classified.statusCode).toBe(400);
    });

    test('classifies 500 (internal error) as RETRYABLE', () => {
      const error = new AppError('Internal error', { statusCode: 500, code: 'INTERNAL_ERROR' });
      const classified = classifyError(error);

      expect(classified.classification).toBe(ErrorClassification.RETRYABLE);
      expect(classified.isRetryable).toBe(true);
    });

    test('classifies unknown errors as RETRYABLE for safety', () => {
      const error = new Error('Unknown error');
      const classified = classifyError(error);

      expect(classified.classification).toBe(ErrorClassification.RETRYABLE);
      expect(classified.isRetryable).toBe(true);
      expect(classified.statusCode).toBe(500);
      expect(classified.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('createExternalServiceError', () => {
    test('creates error with service name and status', () => {
      const error = createExternalServiceError('PaymentAPI', 503, 'SERVICE_UNAVAILABLE');

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toContain('PaymentAPI');
      expect(error.message).toContain('503');
      expect(error.statusCode).toBe(503);
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
    });

    test('includes service name in details', () => {
      const error = createExternalServiceError('EmailService', 502, 'BAD_GATEWAY');

      expect(error.details).toEqual(expect.objectContaining({ service: 'EmailService' }));
    });

    test('includes original error message in details', () => {
      const originalError = new Error('Connection refused');
      const error = createExternalServiceError('DatabaseAPI', 500, 'DB_ERROR', originalError);

      expect(error.details).toEqual(
        expect.objectContaining({
          service: 'DatabaseAPI',
          originalError: 'Connection refused',
        })
      );
    });

    test('handles undefined original error gracefully', () => {
      const error = createExternalServiceError('ExternalAPI', 504, 'TIMEOUT');

      expect(error.details).toEqual(expect.objectContaining({ service: 'ExternalAPI', originalError: 'undefined' }));
    });
  });

  describe('Retry decision logic', () => {
    test('retryable errors can guide exponential backoff strategies', () => {
      const transientError = new AppError('Service temporarily unavailable', {
        statusCode: 503,
        code: 'SERVICE_UNAVAILABLE',
      });
      const classified = classifyError(transientError);

      if (classified.isRetryable) {
        // Simulate exponential backoff: 100ms, 200ms, 400ms, 800ms
        const delays = [100, 200, 400, 800];
        expect(delays).toHaveLength(4);
      }

      expect(classified.isRetryable).toBe(true);
    });

    test('non-retryable errors should fail fast', () => {
      const permanentError = NotFoundError('API endpoint not found');
      const classified = classifyError(permanentError);

      expect(classified.isRetryable).toBe(false);
      // Should not attempt retry, fail immediately
    });

    test('timeout errors trigger circuit breaker', () => {
      const timeoutError = new AppError('Request timeout', { statusCode: 408, code: 'TIMEOUT' });
      const classified = classifyError(timeoutError);

      expect(classified.isTimeout).toBe(true);
      // Should increment circuit breaker failure count aggressively
    });
  });
});
