import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { awardExperience, XP_REWARDS } from '../services/xpService';

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

jest.mock('../services/xpService', () => ({
  awardExperience: jest.fn(),
  XP_REWARDS: {
    LOGIN: 5,
  },
}));

import authController from '../controllers/authController';

describe('Auth Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockCookie: jest.Mock;
  let mockClearCookie: jest.Mock;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJson = jest.fn().mockReturnValue(undefined);
    mockCookie = jest.fn();
    mockClearCookie = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson, send: mockJson });
    mockReq = { body: {}, cookies: {} };
    mockRes = { 
      status: mockStatus, 
      json: mockJson, 
      send: mockJson,
      cookie: mockCookie,
      clearCookie: mockClearCookie
    } as unknown as Response;
    mockNext = jest.fn() as unknown as jest.MockedFunction<NextFunction>;
    process.env.JWT_SECRET = 'secret';
    process.env.NODE_ENV = 'test';
  });

  describe('login', () => {
    test('sets httpOnly cookie and returns sanitized user on success', async () => {
      mockReq.body = { email: 'user@example.com', password: 'password123' };
      mockGetUserByEmail.mockResolvedValue({ id: 1, email: 'user@example.com', username: 'user', password_hash: 'hashed' });
      mockVerifyPassword.mockResolvedValue(true);
      mockJwtSign.mockReturnValue('jwt-token');

      await authController.login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockCookie).toHaveBeenCalledWith('authToken', 'jwt-token', {
        httpOnly: true,
        secure: false, // test environment
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,        
        path: '/'
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
      const payload = mockJson.mock.calls[0][0] as any;
      expect(payload.user).toBeDefined();
      expect(payload.user).not.toHaveProperty('password_hash');
      expect(payload.token).toBe('jwt-token');
      expect(mockJwtSign).toHaveBeenCalledWith({ userId: 1, email: 'user@example.com', role: undefined }, expect.any(String), { expiresIn: '7d' });
      expect(awardExperience).toHaveBeenCalledWith(1, XP_REWARDS.LOGIN, 'login');
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
    test('clears cookie and returns 204', async () => {
      mockReq.cookies = { authToken: 'token-123' };
      mockJwtVerify.mockReturnValue({ userId: 1, email: 'a', exp: Math.floor(Date.now() / 1000) + 1000 });

      await authController.logout(mockReq as Request, mockRes as Response);

      expect(mockJwtVerify).toHaveBeenCalled();
      expect(mockBlacklistToken).toHaveBeenCalledWith('token-123', expect.any(Number));
      expect(mockClearCookie).toHaveBeenCalledWith('authToken', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/'
      });
      expect(mockStatus).toHaveBeenCalledWith(204);
    });
  });

  describe('googleCallback', () => {
    test('sets cookie and redirects to frontend on success', async () => {
      const mockRedirect = jest.fn();
      mockReq.user = { id: 1, email: 'user@gmail.com', role: 'CLIENT' };
      mockRes.redirect = mockRedirect;
      mockJwtSign.mockReturnValue('google-jwt-token');
      process.env.FRONTEND_URL = 'https://localhost:5173';

      await authController.googleCallback(mockReq as Request, mockRes as Response, mockNext);

      expect(mockJwtSign).toHaveBeenCalledWith(
        { userId: 1, email: 'user@gmail.com', role: 'CLIENT' },
        expect.any(String),
        { expiresIn: '7d' }
      );
      expect(mockCookie).toHaveBeenCalledWith('authToken', 'google-jwt-token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });
      expect(awardExperience).toHaveBeenCalledWith(1, XP_REWARDS.LOGIN, 'login');
      expect(mockRedirect).toHaveBeenCalledWith('https://localhost:5173/auth/google/callback');
    });

    test('uses default frontend url when env not set', async () => {
      const mockRedirect = jest.fn();
      mockReq.user = { id: 2, email: 'another@gmail.com', role: 'CLIENT' };
      mockRes.redirect = mockRedirect;
      mockJwtSign.mockReturnValue('another-token');
      delete process.env.FRONTEND_URL;

      await authController.googleCallback(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRedirect).toHaveBeenCalledWith('https://localhost:5173/auth/google/callback');
      expect(awardExperience).toHaveBeenCalledWith(2, XP_REWARDS.LOGIN, 'login');
    });

    test('forwards error when user is missing', async () => {
      mockReq.user = null;

      await authController.googleCallback(mockReq as Request, mockRes as Response, mockNext);

      const forwarded = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(forwarded).toBeInstanceOf(AppError);
      expect(forwarded.statusCode).toBe(401);
    });

    test('forwards error when JWT_SECRET not configured', async () => {
      mockReq.user = { id: 1, email: 'user@gmail.com', role: 'CLIENT' };
      delete process.env.JWT_SECRET;

      await authController.googleCallback(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const forwarded = mockNext.mock.calls[0][0];
      expect(forwarded).toBeDefined();
    });
  });

  describe('getSocketToken', () => {
    test('returns short-lived scoped socket token for authenticated user', async () => {
      mockReq.userId = 42;
      mockReq.user = { id: 42, role: 'CLIENT' } as any;
      mockJwtSign.mockReturnValue('socket-token-123');

      await authController.getSocketToken(mockReq as Request, mockRes as Response, mockNext);

      expect(mockJwtSign).toHaveBeenCalledWith(
        {
          userId: 42,
          role: 'CLIENT',
          tokenType: 'socket',
        },
        expect.any(String),
        {
          expiresIn: '90s',
          audience: 'socket',
        }
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ token: 'socket-token-123' });
    });

    test('forwards auth error when userId is missing', async () => {
      mockReq.userId = undefined;

      await authController.getSocketToken(mockReq as Request, mockRes as Response, mockNext);

      const forwarded = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(forwarded).toBeInstanceOf(AppError);
      expect(forwarded.code).toBe('AUTH_ERROR');
      expect(forwarded.statusCode).toBe(401);
    });
  });
});
