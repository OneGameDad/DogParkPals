import { AppError } from './errors';

/**
 * Classifies errors from outbound service calls for retry/circuit-breaker strategies.
 * - RETRYABLE: Transient errors that may succeed on retry (e.g., timeout, 503)
 * - NON_RETRYABLE: Permanent errors that won't benefit from retry (e.g., 404, 401)
 * - TIMEOUT: Explicit timeout classification for circuit-breaker falloff
 */

export enum ErrorClassification {
  RETRYABLE = 'RETRYABLE',
  NON_RETRYABLE = 'NON_RETRYABLE',
  TIMEOUT = 'TIMEOUT',
}

export interface ClassifiedError {
  classification: ErrorClassification;
  statusCode: number;
  code: string;
  isRetryable: boolean;
  isTimeout: boolean;
}

/**
 * Classify an error for retry/circuit-breaker decisions.
 * Returns metadata to guide retry policies and fallback strategies.
 */
export const classifyError = (error: unknown): ClassifiedError => {
  if (error instanceof AppError) {
    const { statusCode, code } = error;

    // Timeout errors are always retryable with special handling
    if (code === 'TIMEOUT' || statusCode === 408) {
      return {
        classification: ErrorClassification.TIMEOUT,
        statusCode,
        code,
        isRetryable: true,
        isTimeout: true,
      };
    }

    // Server errors (5xx) are generally retryable
    if (statusCode >= 500 && statusCode !== 501) {
      // 501 Not Implemented is not retryable
      return {
        classification: ErrorClassification.RETRYABLE,
        statusCode,
        code,
        isRetryable: true,
        isTimeout: false,
      };
    }

    // Rate limit (429) is retryable with backoff
    if (statusCode === 429) {
      return {
        classification: ErrorClassification.RETRYABLE,
        statusCode,
        code,
        isRetryable: true,
        isTimeout: false,
      };
    }

    // Client errors (4xx) are generally non-retryable
    if (statusCode >= 400 && statusCode < 500) {
      return {
        classification: ErrorClassification.NON_RETRYABLE,
        statusCode,
        code,
        isRetryable: false,
        isTimeout: false,
      };
    }

    // Default non-retryable
    return {
      classification: ErrorClassification.NON_RETRYABLE,
      statusCode,
      code,
      isRetryable: false,
      isTimeout: false,
    };
  }

  // Unknown errors are treated as retryable for safety (will hit circuit breaker)
  return {
    classification: ErrorClassification.RETRYABLE,
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    isRetryable: true,
    isTimeout: false,
  };
};

/**
 * Create a typed error helper that supports retry metadata.
 * Usage:
 *   throw createExternalServiceError('Payment service', 503, 'SERVICE_UNAVAILABLE', error)
 */
export const createExternalServiceError = (
  service: string,
  statusCode: number,
  code: string,
  originalError?: unknown,
): AppError => {
  const message = `${service} returned ${statusCode}: ${code}`;
  return new AppError(message, {
    statusCode,
    code,
    details: {
      service,
      originalError: originalError instanceof Error ? originalError.message : String(originalError),
    },
  });
};
