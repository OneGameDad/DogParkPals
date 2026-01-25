import { describe, test, expect, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { requireRole } from '../middlewares/authorizationMiddleware';
import { AppError } from '../utils/errors';

const build = (role?: string) => {
  const req = { user: role ? { id: 1, role } : undefined } as unknown as Request;
  const res = {} as Response;
  const next = jest.fn() as unknown as jest.MockedFunction<NextFunction>;
  return { req, res, next };
};

describe('requireRole middleware', () => {
  test('allows when role is permitted', () => {
    const { req, res, next } = build('ADMIN');
    const middleware = requireRole('ADMIN', 'DEVELOPER');

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  test('blocks when role missing', () => {
    const { req, res, next } = build(undefined);
    const middleware = requireRole('ADMIN');

    middleware(req, res, next);

    const err = next.mock.calls[0][0] as AppError;
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('AUTH_ERROR');
  });

  test('blocks when role not allowed', () => {
    const { req, res, next } = build('CLIENT');
    const middleware = requireRole('ADMIN');

    middleware(req, res, next);

    const err = next.mock.calls[0][0] as AppError;
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });
});
