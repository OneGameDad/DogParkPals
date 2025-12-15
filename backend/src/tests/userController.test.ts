import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response } from 'express';
import type { User } from '@prisma/client';

// Create mock functions first
const mockGetUserByEmail = jest.fn<Promise<User | null>>();
const mockCreateUser = jest.fn<Promise<User>>();

// Mock the entire userServices module
jest.mock('../services/userServices', () => ({
  __esModule: true,
  default: {
    getUserByEmail: mockGetUserByEmail,
    createUser: mockCreateUser,
  },
}));

// Import controller after mocks are set up
import userController from '../controllers/userController';

describe('User Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

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
    };

    // Create fresh Express response mock
    mockRes = {
      status: mockStatus,
      json: mockJson,
    };
  });

  describe('createUser', () => {
    test('returns 400 when username is missing', async () => {
      mockReq.body = { email: 'test@example.com', password: 'password123' };

      await userController.createUser(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Missing required fields', code: 'VALIDATION_ERROR' });
    });

    test('returns 400 when email is missing', async () => {
      mockReq.body = { username: 'testuser', password: 'password123' };

      await userController.createUser(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Missing required fields', code: 'VALIDATION_ERROR' });
    });

    test('returns 400 when password is missing', async () => {
      mockReq.body = { username: 'testuser', email: 'test@example.com' };

      await userController.createUser(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Missing required fields', code: 'VALIDATION_ERROR' });
    });

    test('returns 400 when password is less than 8 characters', async () => {
      mockReq.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'short',
      };

      await userController.createUser(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Password must be at least 8 characters long', code: 'VALIDATION_ERROR' });
    });

    test('returns 409 when email already exists', async () => {
      mockReq.body = {
        username: 'testuser',
        email: 'existing@example.com',
        password: 'password123',
      };

      const existingUser: Omit<User, 'dogs' | 'favoriteParks' | 'eventsOwned' | 'eventsAttending'> = {
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
      };

      mockGetUserByEmail.mockResolvedValue(existingUser);

      await userController.createUser(mockReq as Request, mockRes as Response);

      expect(mockGetUserByEmail).toHaveBeenCalledWith('existing@example.com');
      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Email already in use', code: 'CONFLICT' });
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    test('returns 201 and user data when user is created successfully', async () => {
      mockReq.body = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      };

      const newUser: Omit<User, 'dogs' | 'favoriteParks' | 'eventsOwned' | 'eventsAttending'> = {
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
      };

      mockGetUserByEmail.mockResolvedValue(null);
      mockCreateUser.mockResolvedValue(newUser);

      await userController.createUser(mockReq as Request, mockRes as Response);

      expect(mockGetUserByEmail).toHaveBeenCalledWith('new@example.com');
      expect(mockCreateUser).toHaveBeenCalledWith('newuser', 'new@example.com', 'password123');
      expect(mockStatus).toHaveBeenCalledWith(201);
      
      // Verify response does not contain password_hash
      const responseCall = mockJson.mock.calls[0][0] as any;
      expect(responseCall).not.toHaveProperty('password_hash');
      expect(responseCall.username).toBe('newuser');
      expect(responseCall.email).toBe('new@example.com');
    });

    test('returns 500 when service throws an error', async () => {
      mockReq.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      mockGetUserByEmail.mockResolvedValue(null);
      mockCreateUser.mockRejectedValue(new Error('Database error'));

      await userController.createUser(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to create user', code: 'INTERNAL_ERROR' });
    });
  });

  describe('getUserByEmail', () => {
    test('returns 404 when user is not found', async () => {
      mockReq.params = { email: 'notfound@example.com' };

      mockGetUserByEmail.mockResolvedValue(null);

      await userController.getUserByEmail(mockReq as Request, mockRes as Response);

      expect(mockGetUserByEmail).toHaveBeenCalledWith('notfound@example.com');
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not found', code: 'NOT_FOUND' });
    });

    test('returns 200 and user data when user is found', async () => {
      mockReq.params = { email: 'test@example.com' };

      const foundUser: Omit<User, 'dogs' | 'favoriteParks' | 'eventsOwned' | 'eventsAttending'> = {
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
      };

      mockGetUserByEmail.mockResolvedValue(foundUser);

      await userController.getUserByEmail(mockReq as Request, mockRes as Response);

      expect(mockGetUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockStatus).toHaveBeenCalledWith(200);
      
      // Verify response does not contain password_hash
      const responseCall = mockJson.mock.calls[0][0] as any;
      expect(responseCall).not.toHaveProperty('password_hash');
      expect(responseCall.email).toBe('test@example.com');
      expect(responseCall.username).toBe('testuser');
    });

    test('returns 500 when service throws an error', async () => {
      mockReq.params = { email: 'test@example.com' };

      mockGetUserByEmail.mockRejectedValue(new Error('Database error'));

      await userController.getUserByEmail(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to retrieve user', code: 'INTERNAL_ERROR' });
    });
  });
});
