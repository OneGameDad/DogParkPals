import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import type { User } from '@prisma/client';
import { AppError, ConflictError, NotFoundError } from '../utils/errors';

// Create mock functions first
const mockGetUserByEmail = jest.fn<any>();
const mockCreateUser = jest.fn<any>();
const mockGetUserById = jest.fn<any>();
const mockGetUserByUsername = jest.fn<any>();
const mockListUsers = jest.fn<any>();
const mockDeleteUser = jest.fn<any>();
const mockChangePassword = jest.fn<any>();
const mockResetUserPassword = jest.fn<any>();

// Mock the entire userServices module
jest.mock('../services/userServices', () => ({
  __esModule: true,
  default: {
    getUserByEmail: mockGetUserByEmail,
    createUser: mockCreateUser,
    getUserById: mockGetUserById,
    getUserByUsername: mockGetUserByUsername,
    listUsers: mockListUsers,
    deleteUser: mockDeleteUser,
    changePassword: mockChangePassword,
    resetUserPassword: mockResetUserPassword,
  },
}));

// Import controller after mocks are set up
import userController from '../controllers/userController';

describe('User Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Clear all mock data before each test
    jest.clearAllMocks();

    // Create fresh Express response mocks with proper chaining
    mockJson = jest.fn().mockReturnValue(undefined);
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    // Create fresh Express request mock
    mockReq = {
      body: {},
      params: {},
        query: {},
    };

    // Create fresh Express response mock
    mockRes = {
      status: mockStatus,
      json: mockJson,
    };

    mockNext = jest.fn();
  });

  describe('createUser', () => {
    test('forwards validation error when username is missing', async () => {
      mockReq.body = { email: 'test@example.com', password: 'password123' };

      await userController.createUser(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockStatus).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
      const forwardedError = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(forwardedError).toBeInstanceOf(AppError);
      expect(forwardedError.statusCode).toBe(400);
      expect(forwardedError.code).toBe('VALIDATION_ERROR');
    });

    test('forwards validation error when email is missing', async () => {
      mockReq.body = { username: 'testuser', password: 'password123' };

      await userController.createUser(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockStatus).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
      const forwardedError = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(forwardedError).toBeInstanceOf(AppError);
      expect(forwardedError.statusCode).toBe(400);
      expect(forwardedError.code).toBe('VALIDATION_ERROR');
    });

    test('forwards validation error when password is missing', async () => {
      mockReq.body = { username: 'testuser', email: 'test@example.com' };

      await userController.createUser(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockStatus).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
      const forwardedError = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(forwardedError).toBeInstanceOf(AppError);
      expect(forwardedError.statusCode).toBe(400);
      expect(forwardedError.code).toBe('VALIDATION_ERROR');
    });

    test('forwards validation error when password is less than 8 characters', async () => {
      mockReq.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'short',
      };

      await userController.createUser(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockStatus).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
      const forwardedError = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(forwardedError).toBeInstanceOf(AppError);
      expect(forwardedError.statusCode).toBe(400);
      expect(forwardedError.code).toBe('VALIDATION_ERROR');
    });

    test('forwards conflict error when email already exists', async () => {
      mockReq.body = {
        username: 'testuser',
        email: 'existing@example.com',
        password: 'password123',
      };

      const existingUser = {
        id: 1,
        email: 'existing@example.com',
        username: 'existinguser',
        password_hash: 'hashed',
        first_name: null,
        last_name: null,
        profilePictureUrl: null,
        role: 'CLIENT',
        ExpPoints: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as User;

      mockGetUserByEmail.mockResolvedValue(existingUser);

      await userController.createUser(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockGetUserByEmail).toHaveBeenCalledWith('existing@example.com');
      expect(mockStatus).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
      const forwardedError = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(forwardedError).toBeInstanceOf(AppError);
      expect(forwardedError.statusCode).toBe(409);
      expect(forwardedError.code).toBe('CONFLICT');
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    test('returns 201 and user data when user is created successfully', async () => {
      mockReq.body = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      };

      const newUser = {
        id: 1,
        username: 'newuser',
        email: 'new@example.com',
        password_hash: 'hashed_password',
        first_name: null,
        last_name: null,
        profilePictureUrl: null,
        role: 'CLIENT',
        ExpPoints: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as User;

      mockGetUserByEmail.mockResolvedValue(null);
      mockCreateUser.mockResolvedValue(newUser);

      await userController.createUser(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockGetUserByEmail).toHaveBeenCalledWith('new@example.com');
      expect(mockCreateUser).toHaveBeenCalledWith('newuser', 'new@example.com', 'password123');
      expect(mockStatus).toHaveBeenCalledWith(201);
      
      // Verify response does not contain password_hash
      const responseCall = mockJson.mock.calls[0][0] as any;
      expect(responseCall).not.toHaveProperty('password_hash');
      expect(responseCall.username).toBe('newuser');
      expect(responseCall.email).toBe('new@example.com');
    });

    test('forwards 500 error when service throws', async () => {
      mockReq.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      mockGetUserByEmail.mockResolvedValue(null);
      mockCreateUser.mockRejectedValue(new Error('Database error'));

      await userController.createUser(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockStatus).not.toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
      const forwardedError = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(forwardedError).toBeInstanceOf(AppError);
      expect(forwardedError.statusCode).toBe(500);
      expect(forwardedError.code).toBe('INTERNAL_ERROR');
      expect(forwardedError.message).toBe('Failed to create user');
    });
  });

  describe('getUserByEmail', () => {
    test('forwards not found error when user is not found', async () => {
      mockReq.params = { email: 'notfound@example.com' };

      mockGetUserByEmail.mockResolvedValue(null);

      await userController.getUserByEmail(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockGetUserByEmail).toHaveBeenCalledWith('notfound@example.com');
      expect(mockStatus).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
      const forwardedError = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(forwardedError).toBeInstanceOf(AppError);
      expect(forwardedError.statusCode).toBe(404);
      expect(forwardedError.code).toBe('NOT_FOUND');
    });

    test('returns 200 and user data when user is found', async () => {
      mockReq.params = { email: 'test@example.com' };

      const foundUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed',
        first_name: 'Test',
        last_name: 'User',
        profilePictureUrl: 'https://example.com/pic.jpg',
        role: 'CLIENT',
        ExpPoints: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as User;

      mockGetUserByEmail.mockResolvedValue(foundUser);

      await userController.getUserByEmail(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockGetUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockStatus).toHaveBeenCalledWith(200);
      
      // Verify response does not contain password_hash
      const responseCall = mockJson.mock.calls[0][0] as any;
      expect(responseCall).not.toHaveProperty('password_hash');
      expect(responseCall.email).toBe('test@example.com');
      expect(responseCall.username).toBe('testuser');
    });

    test('forwards 500 error when service throws', async () => {
      mockReq.params = { email: 'test@example.com' };

      mockGetUserByEmail.mockRejectedValue(new Error('Database error'));

      await userController.getUserByEmail(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockStatus).not.toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
      const forwardedError = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(forwardedError).toBeInstanceOf(AppError);
      expect(forwardedError.statusCode).toBe(500);
      expect(forwardedError.code).toBe('INTERNAL_ERROR');
      expect(forwardedError.message).toBe('Failed to retrieve user');
    });
  });

  describe('getUserById', () => {
    test('forwards not found error when user is not found', async () => {
      mockReq.params = { id: '5' } as any;

      mockGetUserById.mockResolvedValue(null);

      await userController.getUserById(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockGetUserById).toHaveBeenCalledWith(5);
      const forwardedError = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(forwardedError.statusCode).toBe(404);
    });

    test('returns 200 and user data when user is found', async () => {
      mockReq.params = { id: '2' } as any;

      const foundUser: Partial<User> = {
        id: 2,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed',
      } as User;

      mockGetUserById.mockResolvedValue(foundUser);

      await userController.getUserById(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockStatus).toHaveBeenCalledWith(200);
      const responseCall = mockJson.mock.calls[0][0] as any;
      expect(responseCall).not.toHaveProperty('password_hash');
      expect(responseCall.id).toBe(2);
    });

    test('forwards 500 error when service throws', async () => {
      mockReq.params = { id: '3' } as any;
      mockGetUserById.mockRejectedValue(new Error('Database error'));

      await userController.getUserById(mockReq as Request, mockRes as Response, mockNext as any);

      const forwardedError = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(forwardedError.statusCode).toBe(500);
      expect(forwardedError.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('getUserByUsername', () => {
    test('forwards not found error when user is not found', async () => {
      mockReq.params = { username: 'missing' };
      mockGetUserByUsername.mockResolvedValue(null);

      await userController.getUserByUsername(mockReq as Request, mockRes as Response, mockNext as any);

      const forwardedError = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(forwardedError.statusCode).toBe(404);
    });

    test('returns 200 and user data when user is found', async () => {
      mockReq.params = { username: 'founduser' };
      mockGetUserByUsername.mockResolvedValue({
        id: 10,
        username: 'founduser',
        email: 'found@example.com',
        password_hash: 'hashed',
      } as User);

      await userController.getUserByUsername(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockStatus).toHaveBeenCalledWith(200);
      const responseCall = mockJson.mock.calls[0][0] as any;
      expect(responseCall.username).toBe('founduser');
      expect(responseCall).not.toHaveProperty('password_hash');
    });
  });

  describe('getAllUsers', () => {
    test('returns sanitized list of users', async () => {
      mockReq.query = { page: '1', pageSize: '2' } as any;
      mockListUsers.mockResolvedValue([
        { id: 1, username: 'a', email: 'a@example.com', password_hash: 'h1' },
        { id: 2, username: 'b', email: 'b@example.com', password_hash: 'h2' },
      ] as User[]);

      await userController.getAllUsers(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockListUsers).toHaveBeenCalledWith(1, 2);
      expect(mockStatus).toHaveBeenCalledWith(200);
      const responseCall = mockJson.mock.calls[0][0] as any[];
      expect(responseCall[0]).not.toHaveProperty('password_hash');
      expect(responseCall.length).toBe(2);
    });

    test('forwards 500 when service throws', async () => {
      mockListUsers.mockRejectedValue(new Error('boom'));

      await userController.getAllUsers(mockReq as Request, mockRes as Response, mockNext as any);

      const forwardedError = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(forwardedError.statusCode).toBe(500);
    });
  });

  describe('deleteUser', () => {
    test('forwards forbidden when userId does not match', async () => {
      mockReq.params = { id: '3' } as any;
      (mockReq as any).userId = 2;

      await userController.deleteUser(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockDeleteUser).not.toHaveBeenCalled();
      const forwardedError = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(forwardedError.statusCode).toBe(403);
    });

    test('returns 204 when deletion succeeds', async () => {
      mockReq.params = { id: '5' } as any;
      (mockReq as any).userId = 5;
      mockDeleteUser.mockResolvedValue(undefined);

      await userController.deleteUser(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockDeleteUser).toHaveBeenCalledWith(5);
      expect(mockStatus).toHaveBeenCalledWith(204);
    });
  });

  describe('changePassword', () => {
    test('forwards forbidden when not authenticated', async () => {
      mockReq.body = { oldPassword: 'oldpass123', newPassword: 'newpass123' };
      (mockReq as any).userId = undefined;

      await userController.changePassword(mockReq as Request, mockRes as Response, mockNext as any);

      const forwardedError = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(forwardedError.statusCode).toBe(403);
    });

    test('returns 200 when change succeeds', async () => {
      mockReq.body = { oldPassword: 'oldpass123', newPassword: 'newpass123' };
      (mockReq as any).userId = 7;
      mockChangePassword.mockResolvedValue(undefined);

      await userController.changePassword(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockChangePassword).toHaveBeenCalledWith(7, 'oldpass123', 'newpass123');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });
  });

  describe('resetUserPassword', () => {
    test('forwards forbidden when user is not admin', async () => {
      mockReq.body = { userId: 2, newPassword: 'newpass123' };
      (mockReq as any).user = { id: 1, role: 'CLIENT' };

      await userController.resetUserPassword(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const forwardedError = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(forwardedError.statusCode).toBe(403);
    });

    test('forwards forbidden when user role is not set', async () => {
      mockReq.body = { userId: 2, newPassword: 'newpass123' };
      (mockReq as any).user = { id: 1 };

      await userController.resetUserPassword(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const forwardedError = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(forwardedError.statusCode).toBe(403);
    });

    test('resets password when user is admin', async () => {
      mockReq.body = { userId: 2, newPassword: 'newpass123' };
      (mockReq as any).user = { id: 1, role: 'ADMIN' };
      mockResetUserPassword.mockResolvedValue(undefined);

      await userController.resetUserPassword(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockResetUserPassword).toHaveBeenCalledWith(2, 'newpass123');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    test('resets password when user is developer', async () => {
      mockReq.body = { userId: 2, newPassword: 'newpass123' };
      (mockReq as any).user = { id: 1, role: 'DEVELOPER' };
      mockResetUserPassword.mockResolvedValue(undefined);

      await userController.resetUserPassword(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockResetUserPassword).toHaveBeenCalledWith(2, 'newpass123');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });
  });
});
