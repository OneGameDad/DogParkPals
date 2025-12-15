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

const PRISMA_UNIQUE_VIOLATION = 'P2002';
const PRISMA_FOREIGN_KEY_VIOLATION = 'P2003';

export function toAppError(err: unknown, fallback: { message: string; code: string; statusCode?: number }) {
  if (isAppError(err)) return err;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === PRISMA_UNIQUE_VIOLATION) {
      return new AppError('Resource already exists', {
        statusCode: 409,
        code: 'UNIQUE_CONSTRAINT',
        details: err.meta,
      });
    }

    if (err.code === PRISMA_FOREIGN_KEY_VIOLATION) {
      return new AppError('Related resource not found', {
        statusCode: 400,
        code: 'FOREIGN_KEY_CONSTRAINT',
        details: err.meta,
      });
    }
  }

  return new AppError(fallback.message, {
    statusCode: fallback.statusCode ?? 500,
    code: fallback.code,
    details: err,
  });
}
