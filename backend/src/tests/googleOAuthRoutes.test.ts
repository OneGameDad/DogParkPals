import { describe, test, expect, beforeAll, jest } from '@jest/globals';
import request from 'supertest';

const mockGetUserByEmail = jest.fn<any>();

jest.mock('../services/userServices', () => ({
  __esModule: true,
  default: {
    getUserByEmail: mockGetUserByEmail,
  },
}));

let app: any;

beforeAll(async () => {
  process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test-client-id';
  process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'test-client-secret';
  process.env.GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
  app = (await import('../app')).default;
});

describe('Google OAuth Routes - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock user not found scenario
    mockGetUserByEmail.mockResolvedValue(null);
  });

  test('GET /auth/google initiates OAuth flow and redirects', async () => {
    const res = await request(app).get('/auth/google');

    // Google OAuth should redirect to Google's authorization server
    expect([302, 303]).toContain(res.status);
    expect(res.headers.location).toBeDefined();
    expect(res.headers.location).toMatch(/^https:\/\/accounts\.google\.com/);
  });

  test('GET /auth/google redirect URL includes scope parameter', async () => {
    const res = await request(app).get('/auth/google');

    const location = res.headers.location as string;
    // Verify the redirect URL contains scope parameter
    expect(location).toMatch(/scope/i);
  });

  test('POST /auth/login endpoint returns 404 when user not found', async () => {
    mockGetUserByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'Password123' });

    // User not found should return 404
    expect(res.status).toBe(404);
  });

  test('POST /auth/logout endpoint requires authorization', async () => {
    const res = await request(app)
      .post('/auth/logout')
      .send();

    // Logout without token should return 401 (unauthorized)
    expect(res.status).toBe(401);
  });
});
