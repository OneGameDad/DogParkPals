import { expect, describe, test, beforeEach, jest } from '@jest/globals';
import type { User } from '@prisma/client';

const mockCreateDomainEvent = jest.fn((type, payload, options) => ({
  id: 'test-event-id',
  type,
  occurredAt: '2026-02-17T00:00:00.000Z',
  actorId: options?.actorId,
  payload,
  version: 1,
  traceId: options?.traceId,
}));

jest.mock('../events/createDomainEvent', () => ({
  createDomainEvent: mockCreateDomainEvent,
}));

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
      lastSeenAt: new Date(),
      role: 'CLIENT',
      ExpPoints: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
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
      lastSeenAt: new Date(),
      role: 'CLIENT',
      ExpPoints: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
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
      lastSeenAt: new Date(),
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

  test('updateUserProfile updates profile fields', async () => {
    const mockUpdate = jest.fn<any>().mockResolvedValue({
      id: 1,
      username: testUsername,
      email: testEmail,
      first_name: 'UpdatedFirstName',
      last_name: 'UpdatedLastName',
      profilePictureUrl: 'http://example.com/updated.jpg',
      latitude: 40.7,
      longitude: -73.9,
      lastSeenAt: new Date(),
      role: 'CLIENT',
      ExpPoints: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const mockOutboxCreate = jest.fn<any>().mockResolvedValue(undefined);

    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => ({
        user: {
          update: mockUpdate,
        },
        $transaction: jest.fn(async (callback: any) => callback({
          user: {
            update: mockUpdate,
          },
          outboxEvent: {
            create: mockOutboxCreate,
          },
        })),
      })),
    }));

    const userService = await import('../services/userServices');
    const updatedUser = await userService.default.updateUserProfile(1, {
      first_name: 'UpdatedFirstName',
      last_name: 'UpdatedLastName',
      profilePictureUrl: 'http://example.com/updated.jpg',
      latitude: 40.7,
      longitude: -73.9,
    });

    expect(updatedUser.first_name).toBe('UpdatedFirstName');
    expect(updatedUser.last_name).toBe('UpdatedLastName');
    expect(updatedUser.profilePictureUrl).toBe('http://example.com/updated.jpg');
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        first_name: 'UpdatedFirstName',
        last_name: 'UpdatedLastName',
        profilePictureUrl: 'http://example.com/updated.jpg',
        latitude: 40.7,
        longitude: -73.9,
      },
    });
    expect(mockOutboxCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 'test-event-id',
        type: 'user.profile.updated',
        actorId: 1,
      }),
    });
    jest.dontMock('@prisma/client');
  });

  test('changeUserRole updates role when admin user', async () => {
    const adminUser = { id: 1, role: 'ADMIN' };
    const targetUser = { id: 2 };
    const updatedUser = {
      id: 2,
      username: 'target',
      email: 'target@example.com',
      password_hash: 'hashed_password',
      lastSeenAt: new Date(),
      role: 'ADMIN',
      ExpPoints: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as User;

    const mockFindUnique = jest
      .fn<any>()
      .mockResolvedValueOnce(adminUser)
      .mockResolvedValueOnce(targetUser);
    const mockUpdate = jest.fn<any>().mockResolvedValue(updatedUser);

    const mockOutboxCreate = jest.fn<any>().mockResolvedValue(undefined);

    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => ({
        user: {
          findUnique: mockFindUnique,
          update: mockUpdate,
        },
        $transaction: jest.fn(async (callback: any) => callback({
          user: {
            update: mockUpdate,
          },
          outboxEvent: {
            create: mockOutboxCreate,
          },
        })),
      })),
    }));

    const userService = await import('../services/userServices');
    const result = await userService.default.changeUserRole(1, 2, 'ADMIN');

    expect(mockFindUnique).toHaveBeenCalledTimes(2);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { role: 'ADMIN' },
    });
    expect(mockOutboxCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 'test-event-id',
        type: 'user.role.updated',
        actorId: 1,
      }),
    });
    expect(result.role).toBe('ADMIN');

    jest.dontMock('@prisma/client');
  });

  test('changeUserRole throws when admin is not found', async () => {
    const mockFindUnique = jest.fn<any>().mockResolvedValueOnce(null);
    const mockOutboxCreate = jest.fn<any>();

    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => ({
        user: {
          findUnique: mockFindUnique,
        },
        $transaction: jest.fn(async (callback: any) => callback({
          user: {
            update: jest.fn(),
          },
          outboxEvent: {
            create: mockOutboxCreate,
          },
        })),
      })),
    }));

    const userService = await import('../services/userServices');

    await expect(userService.default.changeUserRole(1, 2, 'ADMIN')).rejects.toThrow();

    jest.dontMock('@prisma/client');
  });

  test('changeUserRole throws when admin lacks permission', async () => {
    const mockFindUnique = jest.fn<any>().mockResolvedValueOnce({ id: 1, role: 'CLIENT' });
    const mockOutboxCreate = jest.fn<any>();

    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => ({
        user: {
          findUnique: mockFindUnique,
        },
        $transaction: jest.fn(async (callback: any) => callback({
          user: {
            update: jest.fn(),
          },
          outboxEvent: {
            create: mockOutboxCreate,
          },
        })),
      })),
    }));

    const userService = await import('../services/userServices');

    await expect(userService.default.changeUserRole(1, 2, 'ADMIN')).rejects.toThrow();

    jest.dontMock('@prisma/client');
  });

  test('updateUserProfile handles partial updates', async () => {
    const mockUpdate = jest.fn<any>().mockResolvedValue({
      id: 1,
      first_name: 'OnlyFirstName',
      last_name: null,
      profilePictureUrl: null,
      latitude: null,
      longitude: null,
      lastSeenAt: new Date(),
    });

    const mockOutboxCreate = jest.fn<any>().mockResolvedValue(undefined);

    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => ({
        user: {
          update: mockUpdate,
        },
        $transaction: jest.fn(async (callback: any) => callback({
          user: {
            update: mockUpdate,
          },
          outboxEvent: {
            create: mockOutboxCreate,
          },
        })),
      })),
    }));

    const userService = await import('../services/userServices');
    await userService.default.updateUserProfile(1, {
      first_name: 'OnlyFirstName',
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        first_name: 'OnlyFirstName',
      },
    });
    expect(mockOutboxCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 'test-event-id',
        type: 'user.profile.updated',
        actorId: 1,
      }),
    });
    jest.dontMock('@prisma/client');
  });

  test('changeUsername allows user to update own username', async () => {
    const targetUser = { id: 2, username: 'oldname' };
    const updatedUser = { id: 2, username: 'newname' } as unknown as User;

    const mockFindUnique = jest.fn<any>().mockResolvedValue(targetUser);
    const mockUpdate = jest.fn<any>().mockResolvedValue(updatedUser);
    const mockOutboxCreate = jest.fn<any>().mockResolvedValue(undefined);

    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => ({
        user: {
          findUnique: mockFindUnique,
          update: mockUpdate,
        },
        $transaction: jest.fn(async (callback: any) => callback({
          user: {
            update: mockUpdate,
          },
          outboxEvent: {
            create: mockOutboxCreate,
          },
        })),
      })),
    }));

    const userService = await import('../services/userServices');
    const result = await userService.default.changeUsername(2, 2, 'newname');

    expect(mockFindUnique).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { username: 'newname' },
    });
    expect(mockOutboxCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 'test-event-id',
        type: 'user.profile.updated',
        actorId: 2,
      }),
    });
    expect(result.username).toBe('newname');

    jest.dontMock('@prisma/client');
  });

  test('changeUsername allows admin to update another username', async () => {
    const requestingUser = { id: 1, role: 'ADMIN' };
    const targetUser = { id: 2, username: 'oldname' };
    const updatedUser = { id: 2, username: 'newname' } as unknown as User;

    const mockFindUnique = jest
      .fn<any>()
      .mockResolvedValueOnce(requestingUser)
      .mockResolvedValueOnce(targetUser);
    const mockUpdate = jest.fn<any>().mockResolvedValue(updatedUser);
    const mockOutboxCreate = jest.fn<any>().mockResolvedValue(undefined);

    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => ({
        user: {
          findUnique: mockFindUnique,
          update: mockUpdate,
        },
        $transaction: jest.fn(async (callback: any) => callback({
          user: {
            update: mockUpdate,
          },
          outboxEvent: {
            create: mockOutboxCreate,
          },
        })),
      })),
    }));

    const userService = await import('../services/userServices');
    const result = await userService.default.changeUsername(1, 2, 'newname');

    expect(mockFindUnique).toHaveBeenCalledTimes(2);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { username: 'newname' },
    });
    expect(mockOutboxCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 'test-event-id',
        type: 'user.profile.updated',
        actorId: 1,
      }),
    });
    expect(result.username).toBe('newname');

    jest.dontMock('@prisma/client');
  });

  test('changeUsername throws when requester lacks permission', async () => {
    const requestingUser = { id: 1, role: 'CLIENT' };

    const mockFindUnique = jest.fn<any>().mockResolvedValue(requestingUser);
    const mockOutboxCreate = jest.fn<any>();

    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => ({
        user: {
          findUnique: mockFindUnique,
        },
        $transaction: jest.fn(async (callback: any) => callback({
          user: {
            update: jest.fn(),
          },
          outboxEvent: {
            create: mockOutboxCreate,
          },
        })),
      })),
    }));

    const userService = await import('../services/userServices');

    await expect(userService.default.changeUsername(1, 2, 'newname')).rejects.toThrow();

    jest.dontMock('@prisma/client');
  });

  test('uploadProfilePicture updates profilePictureUrl', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({
      profilePictureUrl: 'uploads/profile.jpg',
    });

    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => ({
        user: {
          update: mockUpdate,
        },
      })),
    }));

    const userService = await import('../services/userServices');

    const result = await userService.default.uploadProfilePicture(
      1,
      'uploads/profile.jpg'
    );

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { profilePictureUrl: 'uploads/profile.jpg' },
      select: { profilePictureUrl: true },
    });

    expect(result.profilePictureUrl).toBe('uploads/profile.jpg');

    jest.dontMock('@prisma/client');
  });

  test('uploadProfilePicture throws AppError when prisma fails', async () => {
    const mockUpdate = jest.fn().mockRejectedValue(new Error('DB fail'));

    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => ({
        user: { update: mockUpdate },
      })),
      Prisma: {
        PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {},
      },
    }));

    const userService = await import('../services/userServices');

    await expect(
      userService.default.uploadProfilePicture(1, 'uploads/profile.jpg')
    ).rejects.toMatchObject({
      code: 'UPLOAD_PROFILE_PICTURE_FAILED',
    });

    jest.dontMock('@prisma/client');
  });

  test('deleteProfilePicture returns null when no profile picture exists', async () => {
    const mockFindUnique = jest.fn().mockResolvedValue({
      profilePictureUrl: null,
    });

    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => ({
        user: {
          findUnique: mockFindUnique,
        },
      })),
    }));

    const userService = await import('../services/userServices');

    const result = await userService.default.deleteProfilePicture(1);

    expect(result).toBeNull();
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { profilePictureUrl: true },
    });

    jest.dontMock('@prisma/client');
  });

  test('deleteProfilePicture deletes file and clears profilePictureUrl', async () => {
    jest.doMock('../utils/password', () => ({
      hashPassword: jest.fn(),
      verifyPassword: jest.fn(),
    }));
    const mockFindUnique = jest.fn().mockResolvedValue({
      profilePictureUrl: 'uploads/profile.jpg',
    });

    const mockUpdate = jest.fn().mockResolvedValue({
      profilePictureUrl: null,
    });

    jest.doMock('fs', () => ({
      existsSync: jest.fn().mockReturnValue(true),
      unlinkSync: jest.fn(),
    }));

    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => ({
        user: {
          findUnique: mockFindUnique,
          update: mockUpdate,
        },
      })),
    }));

    const fs = await import('fs');
    const userService = await import('../services/userServices');

    const result = await userService.default.deleteProfilePicture(1);

    expect(fs.existsSync).toHaveBeenCalled();
    expect(fs.unlinkSync).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { profilePictureUrl: null },
    });

    expect(result.profilePictureUrl).toBeNull();

    jest.dontMock('fs');
    jest.dontMock('@prisma/client');
    jest.dontMock('../utils/password');
  });

  test('deleteProfilePicture throws AppError on failure', async () => {
    const mockFindUnique = jest.fn().mockRejectedValue(new Error('DB fail'));

    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => ({
        user: { findUnique: mockFindUnique },
      })),
      Prisma: {
        PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {},
      },
    }));

    const userService = await import('../services/userServices');

    await expect(
      userService.default.deleteProfilePicture(1)
    ).rejects.toMatchObject({
      code: 'DELETE_PROFILE_PICTURE_FAILED',
    });

    jest.dontMock('@prisma/client');
  });

  test('recordHeartbeat updates lastSeenAt and returns presence', async () => {
    const now = new Date();
    const mockUpdate = jest.fn<any>().mockResolvedValue({
      id: 5,
      lastSeenAt: now,
    });

    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => ({
        user: {
          update: mockUpdate,
        },
      })),
    }));

    const userService = await import('../services/userServices');
    const result = await userService.default.recordHeartbeat(5);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { lastSeenAt: expect.any(Date) },
      select: { id: true, lastSeenAt: true },
    });
    expect(result.userId).toBe(5);
    expect(result.lastSeenAt).toBe(now);
    expect(result.isOnline).toBe(true);
    expect(result.heartbeatIntervalSeconds).toBe(150);
    expect(result.offlineTimeoutSeconds).toBe(300);

    jest.dontMock('@prisma/client');
  });

  test('getUserPresence returns offline status when lastSeenAt is stale', async () => {
    const lastSeenAt = new Date('2020-01-01T00:00:00.000Z');
    const mockFindUnique = jest.fn<any>().mockResolvedValue({
      id: 6,
      lastSeenAt,
    });

    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => ({
        user: {
          findUnique: mockFindUnique,
        },
      })),
    }));

    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(new Date('2020-01-01T00:10:00.000Z').getTime());
    const userService = await import('../services/userServices');
    const result = await userService.default.getUserPresence(6);

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 6 },
      select: { id: true, lastSeenAt: true },
    });
    expect(result.isOnline).toBe(false);
    expect(result.heartbeatIntervalSeconds).toBe(150);
    expect(result.offlineTimeoutSeconds).toBe(300);

    nowSpy.mockRestore();
    jest.dontMock('@prisma/client');
  });
});