import { describe, test, expect } from '@jest/globals';
import request from 'supertest';
import app from '../app';

describe('Google OAuth Routes - Unit Tests', () => {
  test('GET /auth/google initiates OAuth flow and redirects', async () => {
    const res = await request(app).get('/auth/google');

    // Google OAuth should redirect to Google's authorization server
    expect([302, 303]).toContain(res.status);
    expect(res.headers.location).toBeDefined();
  });

  test('GET /auth/google redirect URL includes scope parameter', async () => {
    const res = await request(app).get('/auth/google');

    const location = res.headers.location as string;
    // Verify the redirect URL contains scope parameter
    expect(location).toMatch(/scope/i);
  });

  test('POST /auth/login endpoint returns auth/validation error on invalid input', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'test' });

    // Should return 404 (user not found) or 401 (invalid password)
    expect([401, 404]).toContain(res.status);
  });

  test('POST /auth/logout endpoint requires authorization', async () => {
    const res = await request(app)
      .post('/auth/logout')
      .send();

    // Logout without token should return 401 (unauthorized)
    expect(res.status).toBe(401);
  });
});
