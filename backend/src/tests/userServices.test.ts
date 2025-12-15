import { expect, describe, test, beforeEach, jest } from '@jest/globals';
import type { User } from '@prisma/client';

describe('User Services', () => {
  const testPassword = 'TestP@ssw0rd!';
  const testFirstName = 'Test';
  const testLastName = 'User';
  const testProfilePictureUrl = 'http://example.com/profile.jpg';
  const testUsername = 'testuser';
  const testEmail = 'testuser@example.com';

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    jest.resetModules();
  });

  test('createUser creates a new user with provided details', async () => {
    // Mock the Prisma module with only scalar fields (relations excluded)
    const mockUserData: Omit<User, 'dogOwnerships' | 'favoriteParks' | 'eventsOrganized' | 'organizationsOwned' | 'organizationMemberships' | 'friendshipsRequested' | 'friendshipsReceived' | 'enemies' | 'enemiesOwned' | 'comments' | 'achievements' | 'levels'> = {
      id: 1,
      username: testUsername,
      email: testEmail,
      first_name: testFirstName,
      last_name: testLastName,
      password_hash: 'hashed_password',
      profilePictureUrl: testProfilePictureUrl,
      role: 'CLIENT',
      ExpPoints: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockCreate = jest.fn<() => Promise<typeof mockUserData>>().mockResolvedValue(mockUserData);

    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => ({
        user: {
          create: mockCreate,
        },
      })),
    }));

    // Dynamically import after mock is set up
    const userService = await import('../services/userServices');

    const newUser = await userService.default.createUser(testUsername, testEmail, testPassword, testFirstName, testLastName, testProfilePictureUrl);

    expect(newUser).toHaveProperty('id');
    expect(newUser.username).toBe(testUsername);
    expect(newUser.email).toBe(testEmail);
    expect(newUser.first_name).toBe(testFirstName);
    expect(newUser.last_name).toBe(testLastName);
    expect(newUser.profilePictureUrl).toBe(testProfilePictureUrl);

    // Verify that Prisma create was called with the correct data
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          username: testUsername,
          email: testEmail,
          first_name: testFirstName,
          last_name: testLastName,
          profilePictureUrl: testProfilePictureUrl,
          password_hash: expect.any(String), // Verify password was hashed
        }),
      })
    );

    jest.dontMock('@prisma/client');
  });

  test('getUserByEmail returns user when email exists', async () => {
    const mockUserData: Omit<User, 'dogOwnerships' | 'favoriteParks' | 'eventsOrganized' | 'organizationsOwned' | 'organizationMemberships' | 'friendshipsRequested' | 'friendshipsReceived' | 'enemies' | 'enemiesOwned' | 'comments' | 'achievements' | 'levels'> = {
      id: 1,
      username: testUsername,
      email: testEmail,
      first_name: testFirstName,
      last_name: testLastName,
      password_hash: 'hashed_password',
      profilePictureUrl: testProfilePictureUrl,
      role: 'CLIENT',
      ExpPoints: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockFindUnique = jest.fn<() => Promise<typeof mockUserData | null>>().mockResolvedValue(mockUserData);

    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => ({
        user: {
          findUnique: mockFindUnique,
        },
      })),
    }));

    const userService = await import('../services/userServices');

    const user = await userService.default.getUserByEmail(testEmail);

    expect(user).not.toBeNull();
    expect(user?.email).toBe(testEmail);
    expect(user?.username).toBe(testUsername);

    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: testEmail },
      })
    );

    jest.dontMock('@prisma/client');
  });

  test('getUserByEmail returns null when email does not exist', async () => {
    const mockFindUnique = jest.fn<() => Promise<null>>().mockResolvedValue(null);

    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => ({
        user: {
          findUnique: mockFindUnique,
        },
      })),
    }));

    const userService = await import('../services/userServices');

    const user = await userService.default.getUserByEmail('nonexistent@example.com');

    expect(user).toBeNull();

    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'nonexistent@example.com' },
      })
    );

    jest.dontMock('@prisma/client');
  });
});