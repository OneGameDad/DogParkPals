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
    const mockUserData = {
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
      resetToken: null,
      resetTokenExpiry: null,
    } as unknown as User;

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
    const mockUserData = {
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
      resetToken: null,
      resetTokenExpiry: null,
    } as unknown as User;

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

  test('getUserById returns user when id exists', async () => {
    const mockUserData: Partial<User> = {
      id: 2,
      username: testUsername,
      email: testEmail,
      password_hash: 'hashed_password',
    } as User;

    const mockFindUnique = jest.fn<() => Promise<typeof mockUserData | null>>().mockResolvedValue(mockUserData);

    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => ({
        user: {
          findUnique: mockFindUnique,
        },
      })),
    }));

    const userService = await import('../services/userServices');
    const user = await userService.default.getUserById(2);

    expect(user?.id).toBe(2);
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: 2 } });

    jest.dontMock('@prisma/client');
  });

  test('deleteUser deletes by id', async () => {
    const mockDelete = jest.fn<any>().mockResolvedValue(undefined);

    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => ({
        user: {
          delete: mockDelete,
        },
      })),
    }));

    const userService = await import('../services/userServices');
    await userService.default.deleteUser(3);

    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 3 } });

    jest.dontMock('@prisma/client');
  });

  test('changePassword updates password when old password is valid', async () => {
    const mockFindUnique = jest.fn<any>().mockResolvedValue({ id: 4, password_hash: 'oldhash' });
    const mockUpdate = jest.fn<any>().mockResolvedValue(undefined);

    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => ({
        user: {
          findUnique: mockFindUnique,
          update: mockUpdate,
        },
      })),
    }));

    jest.doMock('../utils/password', () => ({
      hashPassword: jest.fn<any>().mockResolvedValue('newhash'),
      verifyPassword: jest.fn<any>().mockResolvedValue(true),
    }));

    const userService = await import('../services/userServices');
    await userService.default.changePassword(4, 'oldpass', 'newpass123');

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 4 },
      data: { password_hash: 'newhash' },
    });

    jest.dontMock('@prisma/client');
    jest.dontMock('../utils/password');
  });

  test('requestPasswordReset stores hashed token and returns plain token', async () => {
    const mockFindUnique = jest.fn<any>().mockResolvedValue({ id: 5, email: testEmail });
    const mockUpdate = jest.fn<any>().mockResolvedValue(undefined);

    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => ({
        user: {
          findUnique: mockFindUnique,
          update: mockUpdate,
        },
      })),
    }));

    jest.doMock('crypto', () => ({
      randomBytes: () => Buffer.from('plain-token'),
      createHash: () => ({
        update: () => ({ digest: () => 'hashed-token' }),
      }),
    }));

    const userService = await import('../services/userServices');
    const token = await userService.default.requestPasswordReset(testEmail);

    expect(token).toBe('plain-token');
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 5 },
      data: expect.objectContaining({
        resetToken: 'hashed-token',
        resetTokenExpiry: expect.any(Date),
      }),
    });

    jest.dontMock('@prisma/client');
    jest.dontMock('crypto');
  });

  test('resetPassword updates password when token valid', async () => {
    const mockFindFirst = jest.fn<any>().mockResolvedValue({ id: 6 });
    const mockUpdate = jest.fn<any>().mockResolvedValue(undefined);

    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => ({
        user: {
          findFirst: mockFindFirst,
          update: mockUpdate,
        },
      })),
    }));

    jest.doMock('crypto', () => ({
      randomBytes: () => Buffer.from('plain-token'),
      createHash: () => ({
        update: () => ({ digest: () => 'hashed-token' }),
      }),
    }));

    jest.doMock('../utils/password', () => ({
      hashPassword: jest.fn<any>().mockResolvedValue('newhash'),
      verifyPassword: jest.fn<any>(),
    }));

    const userService = await import('../services/userServices');
    await userService.default.resetPassword('plain-token', 'newpass123');

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: {
        resetToken: 'hashed-token',
        resetTokenExpiry: { gt: expect.any(Date) },
      },
    });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 6 },
      data: {
        password_hash: 'newhash',
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    jest.dontMock('@prisma/client');
    jest.dontMock('crypto');
    jest.dontMock('../utils/password');
  });
});