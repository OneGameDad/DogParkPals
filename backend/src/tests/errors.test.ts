import { describe, expect, test } from '@jest/globals';
import { Prisma } from '@prisma/client';
import { AppError, isAppError, toAppError } from '../utils/errors';

const dummyPrismaError = (code: string, meta?: Record<string, unknown>) =>
  new Prisma.PrismaClientKnownRequestError('prisma error', {
    code,
    clientVersion: 'test',
    meta,
  });

describe('AppError', () => {
  test('defaults to 500 INTERNAL_ERROR', () => {
    const err = new AppError('Oops');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.message).toBe('Oops');
  });

  test('accepts custom status/code/details', () => {
    const err = new AppError('Bad request', { statusCode: 400, code: 'BAD_REQUEST', details: { field: 'email' } });
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.details).toEqual({ field: 'email' });
  });
});

describe('isAppError', () => {
  test('returns true for AppError instances', () => {
    expect(isAppError(new AppError('x'))).toBe(true);
  });

  test('returns false for non-AppError values', () => {
    expect(isAppError(new Error('x'))).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
  });
});

describe('toAppError', () => {
  test('passes through existing AppError', () => {
    const err = new AppError('Known', { statusCode: 418, code: 'TEAPOT' });
    const result = toAppError(err, { message: 'fallback', code: 'FALLBACK' });
    expect(result).toBe(err);
  });

  test('maps Prisma unique constraint (P2002) to 409', () => {
    const prismaErr = dummyPrismaError('P2002', { target: ['email'] });
    const result = toAppError(prismaErr, { message: 'fallback', code: 'FALLBACK' });
    expect(result.statusCode).toBe(409);
    expect(result.code).toBe('UNIQUE_CONSTRAINT');
    expect(result.details).toEqual({ target: ['email'] });
  });

  test('maps Prisma foreign key violation (P2003) to 400', () => {
    const prismaErr = dummyPrismaError('P2003', { field: 'parkId' });
    const result = toAppError(prismaErr, { message: 'fallback', code: 'FALLBACK' });
    expect(result.statusCode).toBe(400);
    expect(result.code).toBe('FOREIGN_KEY_CONSTRAINT');
    expect(result.details).toEqual({ field: 'parkId' });
  });

  test('maps Prisma value out of range (P2000) to 400', () => {
    const prismaErr = dummyPrismaError('P2000', { column: 'name' });
    const result = toAppError(prismaErr, { message: 'fallback', code: 'FALLBACK' });
    expect(result.statusCode).toBe(400);
    expect(result.code).toBe('VALUE_OUT_OF_RANGE');
    expect(result.details).toEqual({ column: 'name' });
  });

  test('maps Prisma record not found (P2001) to 404', () => {
    const prismaErr = dummyPrismaError('P2001', { cause: 'User not found' });
    const result = toAppError(prismaErr, { message: 'fallback', code: 'FALLBACK' });
    expect(result.statusCode).toBe(404);
    expect(result.code).toBe('NOT_FOUND');
    expect(result.details).toEqual({ cause: 'User not found' });
  });

  test('maps Prisma constraint failed (P2004) to 409', () => {
    const prismaErr = dummyPrismaError('P2004', { constraint: 'unique_email' });
    const result = toAppError(prismaErr, { message: 'fallback', code: 'FALLBACK' });
    expect(result.statusCode).toBe(409);
    expect(result.code).toBe('CONSTRAINT_FAILED');
    expect(result.details).toEqual({ constraint: 'unique_email' });
  });

  test('wraps unknown errors with fallback', () => {
    const unknown = new Error('boom');
    const result = toAppError(unknown, { message: 'fallback message', code: 'FALLBACK', statusCode: 502 });
    expect(result.statusCode).toBe(502);
    expect(result.code).toBe('FALLBACK');
    expect(result.message).toBe('fallback message');
    expect(result.details).toBe(unknown);
  });

  test('wraps non-error values with fallback', () => {
    const result = toAppError('string error', { message: 'fallback message', code: 'FALLBACK' });
    expect(result.statusCode).toBe(500);
    expect(result.code).toBe('FALLBACK');
    expect(result.message).toBe('fallback message');
    expect(result.details).toBe('string error');
  });
});
