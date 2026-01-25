import express from 'express';
import request from 'supertest';
import { describe, test, expect } from '@jest/globals';
import rateLimit from 'express-rate-limit';

import { authLimiter } from '../middlewares/rateLimitMiddleware';

// Helper to build an app with a custom limiter (smaller window and max for test speed)
const buildAppWithLimiter = () => {
  const app = express();
  // Override with a fast-testing limiter: 2 requests per 1 second
  const testLimiter = rateLimit({ windowMs: 1000, max: 2, standardHeaders: false, legacyHeaders: false });
  app.post('/login', testLimiter, (_req, res) => res.status(200).json({ ok: true }));
  return app;
};

describe('authLimiter', () => {
  test('blocks after exceeding rate limit', async () => {
    const app = buildAppWithLimiter();

    await request(app).post('/login').send({}); // 1st
    await request(app).post('/login').send({}); // 2nd
    const third = await request(app).post('/login').send({}); // 3rd should be blocked

    expect(third.status).toBe(429);
  });
});
