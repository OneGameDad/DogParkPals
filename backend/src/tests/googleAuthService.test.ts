import { describe, test, expect, beforeEach, jest } from '@jest/globals';

const mockGetUserByEmail = jest.fn<any>();
const mockCreateUser = jest.fn<any>();
const mockGetUserById = jest.fn<any>();

jest.mock('../services/userServices', () => ({
  __esModule: true,
  default: {
    getUserByEmail: mockGetUserByEmail,
    createUser: mockCreateUser,
    getUserById: mockGetUserById,
  },
}));

jest.mock('../utils/typeSafeLogger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    logUserAction: jest.fn(),
    logError: jest.fn(),
  },
}));

import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import passport from '../services/googleAuthService';

describe('Google Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/auth/google/callback';
  });

  test('should have google strategy registered', () => {
    const strategies = passport._strategies as any;
    expect(strategies.google).toBeDefined();
    expect(strategies.google.name).toBe('google');
  });

  test('should create new user on first google oauth', (done) => {
    const mockProfile = {
      id: 'google-123',
      emails: [{ value: 'newuser@gmail.com' }],
      name: { givenName: 'John', familyName: 'Doe' },
      photos: [{ value: 'https://example.com/photo.jpg' }],
    };

    mockGetUserByEmail.mockResolvedValue(null);
    mockCreateUser.mockResolvedValue({
      id: 1,
      email: 'newuser@gmail.com',
      username: 'newuser_abc123',
      first_name: 'John',
      last_name: 'Doe',
      profile_picture: 'https://example.com/photo.jpg',
    });

    const strategy = passport._strategies.google as any;
    const verifyCallback = strategy._verify;

    verifyCallback('access-token', 'refresh-token', mockProfile, (err: any, user: any) => {
      expect(err).toBeNull();
      expect(user).toBeDefined();
      expect(user.email).toBe('newuser@gmail.com');
      expect(mockCreateUser).toHaveBeenCalled();
      done();
    });
  });

  test('should login existing user on google oauth', (done) => {
    const mockProfile = {
      id: 'google-456',
      emails: [{ value: 'existing@gmail.com' }],
      name: { givenName: 'Jane', familyName: 'Smith' },
      photos: [{ value: 'https://example.com/photo2.jpg' }],
    };

    const existingUser = {
      id: 2,
      email: 'existing@gmail.com',
      username: 'janesmith',
      first_name: 'Jane',
      last_name: 'Smith',
    };

    mockGetUserByEmail.mockResolvedValue(existingUser);

    const strategy = passport._strategies.google as any;
    const verifyCallback = strategy._verify;

    verifyCallback('access-token', 'refresh-token', mockProfile, (err: any, user: any) => {
      expect(err).toBeNull();
      expect(user).toEqual(existingUser);
      expect(mockCreateUser).not.toHaveBeenCalled();
      done();
    });
  });

  test('should handle missing email from google', (done) => {
    const mockProfile = {
      id: 'google-789',
      emails: [],
      name: { givenName: 'John', familyName: 'Doe' },
    };

    const strategy = passport._strategies.google as any;
    const verifyCallback = strategy._verify;

    verifyCallback('access-token', 'refresh-token', mockProfile, (err: any, user: any) => {
      expect(err).toBeDefined();
      expect(err.message).toBe('No email provided by Google');
      expect(user).toBeUndefined();
      done();
    });
  });

  test('should serialize user by id', (done) => {
    const user = { id: 1, email: 'test@gmail.com' };
    passport.serializeUser(user as any, (err: any, id: any) => {
      expect(err).toBeNull();
      expect(id).toBe(1);
      done();
    });
  });

  test('should deserialize user by id', (done) => {
    const mockUser = { id: 1, email: 'test@gmail.com', username: 'testuser' };
    mockGetUserById.mockResolvedValue(mockUser);

    passport.deserializeUser(1, (err: any, user: any) => {
      expect(err).toBeNull();
      expect(user).toEqual(mockUser);
      expect(mockGetUserById).toHaveBeenCalledWith(1);
      done();
    });
  });

  test('should handle deserialization error', (done) => {
    const error = new Error('Database error');
    mockGetUserById.mockRejectedValue(error);

    passport.deserializeUser(1, (err: any, user: any) => {
      expect(err).toEqual(error);
      expect(user).toBeNull();
      done();
    });
  });
});
