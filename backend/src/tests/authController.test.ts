import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

const mockGetUserByEmail = jest.fn<any>();
const mockVerifyPassword = jest.fn<any>();
const mockJwtSign = jest.fn<any>();
const mockJwtVerify = jest.fn<any>();
const mockBlacklistToken = jest.fn<any>();

jest.mock('../services/userServices', () => ({
  __esModule: true,
  default: {
    getUserByEmail: mockGetUserByEmail,
  },
}));

jest.mock('../utils/password', () => ({
  verifyPassword: mockVerifyPassword,
}));

jest.mock('jsonwebtoken', () => ({
  sign: (...args: any[]) => mockJwtSign(...args),
  verify: (...args: any[]) => mockJwtVerify(...args),
}));

jest.mock('../utils/tokenBlacklist', () => ({
  blacklistToken: (...args: any[]) => mockBlacklistToken(...args),
}));

import authController from '../controllers/authController';

describe('Auth Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJson = jest.fn().mockReturnValue(undefined);
    mockStatus = jest.fn().mockReturnValue({ json: mockJson, send: mockJson });
    mockReq = { body: {} };
    mockRes = { status: mockStatus, json: mockJson, send: mockJson } as unknown as Response;
    mockNext = jest.fn() as unknown as jest.MockedFunction<NextFunction>;
    process.env.JWT_SECRET = 'secret';
  });

  describe('login', () => {
    test('returns token and sanitized user on success', async () => {
      mockReq.body = { email: 'user@example.com', password: 'password123' };
      mockGetUserByEmail.mockResolvedValue({ id: 1, email: 'user@example.com', username: 'user', password_hash: 'hashed' });
      mockVerifyPassword.mockResolvedValue(true);
      mockJwtSign.mockReturnValue('jwt-token');

      await authController.login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(200);
      const payload = mockJson.mock.calls[0][0] as any;
      expect(payload.token).toBe('jwt-token');
      expect(payload.user).not.toHaveProperty('password_hash');
      expect(mockJwtSign).toHaveBeenCalledWith({ userId: 1, email: 'user@example.com', role: undefined }, expect.any(String), { expiresIn: '7d' });
    });

    test('forwards not found when user missing', async () => {
      mockReq.body = { email: 'missing@example.com', password: 'password123' };
      mockGetUserByEmail.mockResolvedValue(null);

      await authController.login(mockReq as Request, mockRes as Response, mockNext);

      const forwarded = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(forwarded).toBeInstanceOf(AppError);
      expect(forwarded.statusCode).toBe(404);
    });

    test('forwards auth error when password invalid', async () => {
      mockReq.body = { email: 'user@example.com', password: 'wrong' };
      mockGetUserByEmail.mockResolvedValue({ id: 1, email: 'user@example.com', username: 'user', password_hash: 'hashed' });
      mockVerifyPassword.mockResolvedValue(false);

      await authController.login(mockReq as Request, mockRes as Response, mockNext);

      const forwarded = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(forwarded.code).toBe('AUTH_ERROR');
      expect(forwarded.statusCode).toBe(401);
    });
  });

  describe('logout', () => {
    test('returns 204', async () => {
      mockReq.headers = { authorization: 'Bearer token-123' } as any;
      mockJwtVerify.mockReturnValue({ userId: 1, email: 'a', exp: Math.floor(Date.now() / 1000) + 1000 });

      await authController.logout(mockReq as Request, mockRes as Response);

      expect(mockJwtVerify).toHaveBeenCalled();
      expect(mockBlacklistToken).toHaveBeenCalledWith('token-123', expect.any(Number));
      expect(mockStatus).toHaveBeenCalledWith(204);
    });
  });
});
