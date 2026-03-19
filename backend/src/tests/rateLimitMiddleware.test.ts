import express from 'express';
import request from 'supertest';
import { describe, test, expect } from '@jest/globals';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

import { getAuthRateLimitKey } from '../middlewares/rateLimitMiddleware';

// Helper to build an app with a custom limiter (smaller window and max for test speed)
const buildAppWithLimiter = () => {
  const app = express();
  app.use(express.json());

  // Override with a fast-testing limiter: 2 requests per 1 second
  const testLimiter = rateLimit({
    windowMs: 1000,
    max: 2,
    standardHeaders: false,
    legacyHeaders: false,
    keyGenerator: (req) => getAuthRateLimitKey(req.body, `auth:anonymous:${ipKeyGenerator(req.ip ?? '')}`),
  });

  app.post('/login', testLimiter, (_req, res) => res.status(200).json({ ok: true }));
  return app;
};

describe('authLimiter', () => {
  test('blocks after exceeding rate limit for same user', async () => {
    const app = buildAppWithLimiter();

    await request(app).post('/login').send({ email: 'alice@example.com' }); // 1st
    await request(app).post('/login').send({ email: 'alice@example.com' }); // 2nd
    const third = await request(app).post('/login').send({ email: 'alice@example.com' }); // 3rd should be blocked

    expect(third.status).toBe(429);
  });

  test('tracks different users independently', async () => {
    const app = buildAppWithLimiter();

    const firstUserFirst = await request(app).post('/login').send({ email: 'alice@example.com' });
    const firstUserSecond = await request(app).post('/login').send({ email: 'alice@example.com' });
    const secondUserFirst = await request(app).post('/login').send({ email: 'bob@example.com' });
    const secondUserSecond = await request(app).post('/login').send({ email: 'bob@example.com' });
    const firstUserThird = await request(app).post('/login').send({ email: 'alice@example.com' });

    expect(firstUserFirst.status).toBe(200);
    expect(firstUserSecond.status).toBe(200);
    expect(secondUserFirst.status).toBe(200);
    expect(secondUserSecond.status).toBe(200);
    expect(firstUserThird.status).toBe(429);
  });

  test('normalizes email for key generation', () => {
    const keyWithWhitespaceAndCase = getAuthRateLimitKey({ email: '  Alice@Example.com  ' });
    const normalizedKey = getAuthRateLimitKey({ email: 'alice@example.com' });

    expect(keyWithWhitespaceAndCase).toBe(normalizedKey);
  });

  test('falls back to anonymous key when email is missing', () => {
    const missing = getAuthRateLimitKey({}, 'auth:anonymous:10.0.0.1');
    const notObject = getAuthRateLimitKey(null, 'auth:anonymous:10.0.0.2');
    const emptyString = getAuthRateLimitKey({ email: '   ' }, 'auth:anonymous:10.0.0.3');
    const withoutIp = getAuthRateLimitKey({});

    expect(missing).toBe('auth:anonymous:10.0.0.1');
    expect(notObject).toBe('auth:anonymous:10.0.0.2');
    expect(emptyString).toBe('auth:anonymous:10.0.0.3');
    expect(withoutIp).toBe('auth:anonymous');
  });
});
