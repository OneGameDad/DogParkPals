import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { AppError } from '../utils/errors';
import { errorHandler } from '../middlewares/errorHandler';
import { requestIdMiddleware } from '../middlewares/requestId';

jest.mock('../utils/typeSafeLogger', () => ({
  __esModule: true,
  default: {
    logError: jest.fn(),
    logRequest: jest.fn(),
    logUserAction: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('errorHandler middleware', () => {
  let app: express.Express;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(requestIdMiddleware);

    app.get('/app-error', (_req, _res, next) => {
      next(new AppError('Bad input', { statusCode: 400, code: 'BAD_INPUT', details: { field: 'email' } }));
    });

    app.get('/unknown-error', () => {
      throw new Error('Unexpected failure');
    });

    app.use(errorHandler);
  });

  test('returns structured response for AppError and includes requestId', async () => {
    const response = await request(app).get('/app-error');

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: 'Bad input',
      code: 'BAD_INPUT',
      details: { field: 'email' },
    });
    expect(typeof response.body.requestId).toBe('string');
    expect(typeof response.headers['x-request-id']).toBe('string');
  });

  test('maps unknown errors to 500 without leaking details and includes requestId', async () => {
    const response = await request(app).get('/unknown-error');

    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    expect(response.body.details).toBeUndefined();
    expect(typeof response.body.requestId).toBe('string');
    expect(typeof response.headers['x-request-id']).toBe('string');
  });
});
