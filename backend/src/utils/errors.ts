import { Prisma } from '@prisma/client';

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(message: string, options?: { statusCode?: number; code?: string; details?: unknown }) {
    super(message);
    this.statusCode = options?.statusCode ?? 500;
    this.code = options?.code ?? 'INTERNAL_ERROR';
    this.details = options?.details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const isAppError = (err: unknown): err is AppError => err instanceof AppError;

// Convenience helpers for common HTTP error semantics
export const ValidationError = (message = 'Validation failed', details?: unknown) =>
  new AppError(message, { statusCode: 400, code: 'VALIDATION_ERROR', details });

export const AuthError = (message = 'Authentication required', details?: unknown) =>
  new AppError(message, { statusCode: 401, code: 'AUTH_ERROR', details });

export const ForbiddenError = (message = 'Forbidden', details?: unknown) =>
  new AppError(message, { statusCode: 403, code: 'FORBIDDEN', details });

export const NotFoundError = (message = 'Not found', details?: unknown) =>
  new AppError(message, { statusCode: 404, code: 'NOT_FOUND', details });

export const ConflictError = (message = 'Conflict', details?: unknown) =>
  new AppError(message, { statusCode: 409, code: 'CONFLICT', details });

export const RateLimitError = (message = 'Too many requests', details?: unknown) =>
  new AppError(message, { statusCode: 429, code: 'RATE_LIMITED', details });

export const UpstreamError = (
  message = 'Upstream service error',
  details?: unknown,
  statusCode: 502 | 504 = 502,
) => new AppError(message, { statusCode, code: 'UPSTREAM_ERROR', details });

const PRISMA_VALUE_OUT_OF_RANGE = 'P2000';
const PRISMA_RECORD_NOT_FOUND = 'P2001';
const PRISMA_UNIQUE_VIOLATION = 'P2002';
const PRISMA_FOREIGN_KEY_VIOLATION = 'P2003';
const PRISMA_CONSTRAINT_FAILED = 'P2004';

export function toAppError(err: unknown, fallback: { message: string; code: string; statusCode?: number }) {
  if (isAppError(err)) return err;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case PRISMA_VALUE_OUT_OF_RANGE:
        return new AppError('Value out of range for column', {
          statusCode: 400,
          code: 'VALUE_OUT_OF_RANGE',
          details: err.meta,
        });
      case PRISMA_RECORD_NOT_FOUND:
        return new AppError('Resource not found', {
          statusCode: 404,
          code: 'NOT_FOUND',
          details: err.meta,
        });
      case PRISMA_UNIQUE_VIOLATION:
        return new AppError('Resource already exists', {
          statusCode: 409,
          code: 'UNIQUE_CONSTRAINT',
          details: err.meta,
        });
      case PRISMA_FOREIGN_KEY_VIOLATION:
        return new AppError('Related resource not found', {
          statusCode: 400,
          code: 'FOREIGN_KEY_CONSTRAINT',
          details: err.meta,
        });
      case PRISMA_CONSTRAINT_FAILED:
        return new AppError('Constraint failed', {
          statusCode: 409,
          code: 'CONSTRAINT_FAILED',
          details: err.meta,
        });
      default:
        break;
    }
  }

  return new AppError(fallback.message, {
    statusCode: fallback.statusCode ?? 500,
    code: fallback.code,
    details: err,
  });
}
