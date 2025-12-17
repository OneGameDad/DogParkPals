import { expect, describe, test, beforeEach, jest } from '@jest/globals';
import type { Friendship, User } from '@prisma/client';

describe('Friend Service', () => {
  const mockRequesterId = 1;
  const mockAddresseeId = 2;
  const mockUserId = 1;
  const mockFriendId = 3;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('sendFriendRequest', () => {
    test('should successfully send a friend request', async () => {
      const mockFriendship: Friendship = {
        requesterId: mockRequesterId,
        addresseeId: mockAddresseeId,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCreate = jest.fn<() => Promise<Friendship>>().mockResolvedValue(mockFriendship);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            create: mockCreate,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.sendFriendRequest(mockRequesterId, mockAddresseeId);

      expect(result).toEqual(mockFriendship);
      expect(result.requesterId).toBe(mockRequesterId);
      expect(result.addresseeId).toBe(mockAddresseeId);
      expect(result.status).toBe('PENDING');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            requesterId: mockRequesterId,
            addresseeId: mockAddresseeId,
            status: 'PENDING',
          },
        })
      );

      jest.dontMock('@prisma/client');
    });

    test('should throw error when validation fails', async () => {
      const mockCreate = jest.fn();

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            create: mockCreate,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      await expect(
        friendService.default.sendFriendRequest(-1, mockAddresseeId)
      ).rejects.toThrow();

      expect(mockCreate).not.toHaveBeenCalled();

      jest.dontMock('@prisma/client');
    });

    test('should throw error when database operation fails', async () => {
      const mockCreate = jest.fn<() => Promise<Friendship>>().mockRejectedValue(new Error('Database error'));

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            create: mockCreate,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      await expect(
        friendService.default.sendFriendRequest(mockRequesterId, mockAddresseeId)
      ).rejects.toThrow();

      jest.dontMock('@prisma/client');
    });

    test('should throw error when requesterId equals addresseeId', async () => {
      const mockCreate = jest.fn();

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            create: mockCreate,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      await expect(
        friendService.default.sendFriendRequest(mockRequesterId, mockRequesterId)
      ).rejects.toThrow();

      expect(mockCreate).not.toHaveBeenCalled();

      jest.dontMock('@prisma/client');
    });
  });

  describe('acceptFriendRequest', () => {
    test('should successfully accept a friend request', async () => {
      const mockUpdatedFriendship: Friendship = {
        requesterId: mockRequesterId,
        addresseeId: mockAddresseeId,
        status: 'ACCEPTED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdate = jest.fn<() => Promise<Friendship>>().mockResolvedValue(mockUpdatedFriendship);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            update: mockUpdate,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.acceptFriendRequest(mockRequesterId, mockAddresseeId);

      expect(result).toEqual(mockUpdatedFriendship);
      expect(result.status).toBe('ACCEPTED');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            requesterId_addresseeId: {
              requesterId: mockRequesterId,
              addresseeId: mockAddresseeId,
            },
          },
          data: { status: 'ACCEPTED' },
        })
      );

      jest.dontMock('@prisma/client');
    });

    test('should throw error when friend request does not exist', async () => {
      const mockUpdate = jest.fn<() => Promise<Friendship>>().mockRejectedValue(new Error('Record not found'));

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            update: mockUpdate,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      await expect(
        friendService.default.acceptFriendRequest(mockRequesterId, mockAddresseeId)
      ).rejects.toThrow();

      jest.dontMock('@prisma/client');
    });

    test('should throw error when database operation fails', async () => {
      const mockUpdate = jest.fn<() => Promise<Friendship>>().mockRejectedValue(new Error('Database error'));

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            update: mockUpdate,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      await expect(
        friendService.default.acceptFriendRequest(mockRequesterId, mockAddresseeId)
      ).rejects.toThrow();

      jest.dontMock('@prisma/client');
    });
  });

  describe('declineFriendRequest', () => {
    test('should successfully decline a friend request', async () => {
      const mockUpdatedFriendship: Friendship = {
        requesterId: mockRequesterId,
        addresseeId: mockAddresseeId,
        status: 'REJECTED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdate = jest.fn<() => Promise<Friendship>>().mockResolvedValue(mockUpdatedFriendship);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            update: mockUpdate,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.declineFriendRequest(mockRequesterId, mockAddresseeId);

      expect(result).toEqual(mockUpdatedFriendship);
      expect(result.status).toBe('REJECTED');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            requesterId_addresseeId: {
              requesterId: mockRequesterId,
              addresseeId: mockAddresseeId,
            },
          },
          data: { status: 'REJECTED' },
        })
      );

      jest.dontMock('@prisma/client');
    });

    test('should throw error when friend request does not exist', async () => {
      const mockUpdate = jest.fn<() => Promise<Friendship>>().mockRejectedValue(new Error('Record not found'));

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            update: mockUpdate,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      await expect(
        friendService.default.declineFriendRequest(mockRequesterId, mockAddresseeId)
      ).rejects.toThrow();

      jest.dontMock('@prisma/client');
    });

    test('should throw error when database operation fails', async () => {
      const mockUpdate = jest.fn<() => Promise<Friendship>>().mockRejectedValue(new Error('Database error'));

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            update: mockUpdate,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      await expect(
        friendService.default.declineFriendRequest(mockRequesterId, mockAddresseeId)
      ).rejects.toThrow();

      jest.dontMock('@prisma/client');
    });
  });

  describe('removeFriend', () => {
    test('should successfully remove a friendship (requester removes addressee)', async () => {
      const mockDeleteResult = { count: 1 };

      const mockDeleteMany = jest.fn<() => Promise<{ count: number }>>().mockResolvedValue(mockDeleteResult);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            deleteMany: mockDeleteMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.removeFriend(mockUserId, mockFriendId);

      expect(result).toEqual(mockDeleteResult);
      expect(result.count).toBe(1);
      expect(mockDeleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { requesterId: mockUserId, addresseeId: mockFriendId },
              { requesterId: mockFriendId, addresseeId: mockUserId },
            ],
          },
        })
      );

      jest.dontMock('@prisma/client');
    });

    test('should successfully remove a friendship (addressee removes requester)', async () => {
      const mockDeleteResult = { count: 1 };

      const mockDeleteMany = jest.fn<() => Promise<{ count: number }>>().mockResolvedValue(mockDeleteResult);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            deleteMany: mockDeleteMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.removeFriend(mockFriendId, mockUserId);

      expect(result).toEqual(mockDeleteResult);
      expect(mockDeleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { requesterId: mockFriendId, addresseeId: mockUserId },
              { requesterId: mockUserId, addresseeId: mockFriendId },
            ],
          },
        })
      );

      jest.dontMock('@prisma/client');
    });

    test('should return count 0 when friendship does not exist', async () => {
      const mockDeleteResult = { count: 0 };

      const mockDeleteMany = jest.fn<() => Promise<{ count: number }>>().mockResolvedValue(mockDeleteResult);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            deleteMany: mockDeleteMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.removeFriend(mockUserId, mockFriendId);

      expect(result.count).toBe(0);

      jest.dontMock('@prisma/client');
    });

    test('should throw error when database operation fails', async () => {
      const mockDeleteMany = jest.fn<() => Promise<{ count: number }>>().mockRejectedValue(new Error('Database error'));

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            deleteMany: mockDeleteMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      await expect(
        friendService.default.removeFriend(mockUserId, mockFriendId)
      ).rejects.toThrow();

      jest.dontMock('@prisma/client');
    });
  });

  describe('getFriendsList', () => {
    test('should successfully retrieve friends list for user as requester', async () => {
      const mockFriendships: Friendship[] = [
        {
          requesterId: mockUserId,
          addresseeId: 2,
          status: 'ACCEPTED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          requesterId: mockUserId,
          addresseeId: 3,
          status: 'ACCEPTED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockFriends: User[] = [
        {
          id: 2,
          email: 'friend1@example.com',
          password_hash: 'hash',
          username: 'friend1',
          first_name: 'Friend',
          last_name: 'One',
          profilePictureUrl: null,
          latitude: null,
          longitude: null,
          role: 'CLIENT',
          ExpPoints: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 3,
          email: 'friend2@example.com',
          password_hash: 'hash',
          username: 'friend2',
          first_name: 'Friend',
          last_name: 'Two',
          profilePictureUrl: null,
          latitude: null,
          longitude: null,
          role: 'CLIENT',
          ExpPoints: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockFindMany = jest.fn<() => Promise<Friendship[]>>().mockResolvedValue(mockFriendships);
      const mockUserFindMany = jest.fn<() => Promise<User[]>>().mockResolvedValue(mockFriends);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
          },
          user: {
            findMany: mockUserFindMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.getFriendsList(mockUserId);

      expect(result).toEqual(mockFriends);
      expect(result.length).toBe(2);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              {
                OR: [
                  { requesterId: mockUserId },
                  { addresseeId: mockUserId },
                ],
              },
              { status: 'ACCEPTED' },
            ],
          },
        })
      );
      expect(mockUserFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: [2, 3] } },
        })
      );

      jest.dontMock('@prisma/client');
    });

    test('should successfully retrieve friends list for user as addressee', async () => {
      const mockFriendships: Friendship[] = [
        {
          requesterId: 2,
          addresseeId: mockUserId,
          status: 'ACCEPTED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          requesterId: 3,
          addresseeId: mockUserId,
          status: 'ACCEPTED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockFriends: User[] = [
        {
          id: 2,
          email: 'friend1@example.com',
          password_hash: 'hash',
          username: 'friend1',
          first_name: 'Friend',
          last_name: 'One',
          profilePictureUrl: null,
          latitude: null,
          longitude: null,
          role: 'CLIENT',
          ExpPoints: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 3,
          email: 'friend2@example.com',
          password_hash: 'hash',
          username: 'friend2',
          first_name: 'Friend',
          last_name: 'Two',
          profilePictureUrl: null,
          latitude: null,
          longitude: null,
          role: 'CLIENT',
          ExpPoints: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockFindMany = jest.fn<() => Promise<Friendship[]>>().mockResolvedValue(mockFriendships);
      const mockUserFindMany = jest.fn<() => Promise<User[]>>().mockResolvedValue(mockFriends);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
          },
          user: {
            findMany: mockUserFindMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.getFriendsList(mockUserId);

      expect(result).toEqual(mockFriends);
      expect(result.length).toBe(2);
      expect(mockUserFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: [2, 3] } },
        })
      );

      jest.dontMock('@prisma/client');
    });

    test('should return empty array when user has no friends', async () => {
      const mockFriendships: Friendship[] = [];
      const mockFriends: User[] = [];

      const mockFindMany = jest.fn<() => Promise<Friendship[]>>().mockResolvedValue(mockFriendships);
      const mockUserFindMany = jest.fn<() => Promise<User[]>>().mockResolvedValue(mockFriends);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
          },
          user: {
            findMany: mockUserFindMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.getFriendsList(mockUserId);

      expect(result).toEqual([]);
      expect(result.length).toBe(0);

      jest.dontMock('@prisma/client');
    });

    test('should only return ACCEPTED friendships', async () => {
      const mockFriendships: Friendship[] = [
        {
          requesterId: mockUserId,
          addresseeId: 2,
          status: 'ACCEPTED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockFriends: User[] = [
        {
          id: 2,
          email: 'friend1@example.com',
          password_hash: 'hash',
          username: 'friend1',
          first_name: 'Friend',
          last_name: 'One',
          profilePictureUrl: null,
          latitude: null,
          longitude: null,
          role: 'CLIENT',
          ExpPoints: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockFindMany = jest.fn<() => Promise<Friendship[]>>().mockResolvedValue(mockFriendships);
      const mockUserFindMany = jest.fn<() => Promise<User[]>>().mockResolvedValue(mockFriends);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
          },
          user: {
            findMany: mockUserFindMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.getFriendsList(mockUserId);

      expect(result.length).toBe(1);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({ status: 'ACCEPTED' }),
            ]),
          }),
        })
      );

      jest.dontMock('@prisma/client');
    });

    test('should handle mixed requester and addressee friendships', async () => {
      const mockFriendships: Friendship[] = [
        {
          requesterId: mockUserId,
          addresseeId: 2,
          status: 'ACCEPTED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          requesterId: 3,
          addresseeId: mockUserId,
          status: 'ACCEPTED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockFriends: User[] = [
        {
          id: 2,
          email: 'friend1@example.com',
          password_hash: 'hash',
          username: 'friend1',
          first_name: 'Friend',
          last_name: 'One',
          profilePictureUrl: null,
          latitude: null,
          longitude: null,
          role: 'CLIENT',
          ExpPoints: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 3,
          email: 'friend2@example.com',
          password_hash: 'hash',
          username: 'friend2',
          first_name: 'Friend',
          last_name: 'Two',
          profilePictureUrl: null,
          latitude: null,
          longitude: null,
          role: 'CLIENT',
          ExpPoints: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockFindMany = jest.fn<() => Promise<Friendship[]>>().mockResolvedValue(mockFriendships);
      const mockUserFindMany = jest.fn<() => Promise<User[]>>().mockResolvedValue(mockFriends);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
          },
          user: {
            findMany: mockUserFindMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.getFriendsList(mockUserId);

      expect(result.length).toBe(2);
      expect(mockUserFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: [2, 3] } },
        })
      );

      jest.dontMock('@prisma/client');
    });

    test('should throw error when database operation fails', async () => {
      const mockFindMany = jest.fn<() => Promise<Friendship[]>>().mockRejectedValue(new Error('Database error'));

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      await expect(
        friendService.default.getFriendsList(mockUserId)
      ).rejects.toThrow();

      jest.dontMock('@prisma/client');
    });

    test('should throw error when validation fails', async () => {
      const mockFindMany = jest.fn();

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      await expect(
        friendService.default.getFriendsList(-1)
      ).rejects.toThrow();

      expect(mockFindMany).not.toHaveBeenCalled();

      jest.dontMock('@prisma/client');
    });
  });

  describe('getFriend', () => {
    test('should successfully retrieve friends for user as requester', async () => {
      const mockFriendships: Friendship[] = [
        {
          requesterId: mockUserId,
          addresseeId: 2,
          status: 'ACCEPTED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          requesterId: mockUserId,
          addresseeId: 3,
          status: 'ACCEPTED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockFriends: User[] = [
        {
          id: 2,
          email: 'friend1@example.com',
          password_hash: 'hash',
          username: 'friend1',
          first_name: 'Friend',
          last_name: 'One',
          profilePictureUrl: null,
          latitude: null,
          longitude: null,
          role: 'CLIENT',
          ExpPoints: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 3,
          email: 'friend2@example.com',
          password_hash: 'hash',
          username: 'friend2',
          first_name: 'Friend',
          last_name: 'Two',
          profilePictureUrl: null,
          latitude: null,
          longitude: null,
          role: 'CLIENT',
          ExpPoints: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockFindMany = jest.fn<() => Promise<Friendship[]>>().mockResolvedValue(mockFriendships);
      const mockUserFindMany = jest.fn<() => Promise<User[]>>().mockResolvedValue(mockFriends);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
          },
          user: {
            findMany: mockUserFindMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.getFriend(mockUserId);

      expect(result).toEqual(mockFriends);
      expect(result.length).toBe(2);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              {
                OR: [
                  { requesterId: mockUserId },
                  { addresseeId: mockUserId },
                ],
              },
              { status: 'ACCEPTED' },
            ],
          },
        })
      );
      expect(mockUserFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: [2, 3] } },
        })
      );

      jest.dontMock('@prisma/client');
    });

    test('should successfully retrieve friends for user as addressee', async () => {
      const mockFriendships: Friendship[] = [
        {
          requesterId: 2,
          addresseeId: mockUserId,
          status: 'ACCEPTED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockFriends: User[] = [
        {
          id: 2,
          email: 'friend1@example.com',
          password_hash: 'hash',
          username: 'friend1',
          first_name: 'Friend',
          last_name: 'One',
          profilePictureUrl: null,
          latitude: null,
          longitude: null,
          role: 'CLIENT',
          ExpPoints: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockFindMany = jest.fn<() => Promise<Friendship[]>>().mockResolvedValue(mockFriendships);
      const mockUserFindMany = jest.fn<() => Promise<User[]>>().mockResolvedValue(mockFriends);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
          },
          user: {
            findMany: mockUserFindMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.getFriend(mockUserId);

      expect(result).toEqual(mockFriends);
      expect(result.length).toBe(1);

      jest.dontMock('@prisma/client');
    });

    test('should return empty array when user has no friends', async () => {
      const mockFriendships: Friendship[] = [];
      const mockFriends: User[] = [];

      const mockFindMany = jest.fn<() => Promise<Friendship[]>>().mockResolvedValue(mockFriendships);
      const mockUserFindMany = jest.fn<() => Promise<User[]>>().mockResolvedValue(mockFriends);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
          },
          user: {
            findMany: mockUserFindMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.getFriend(mockUserId);

      expect(result).toEqual([]);
      expect(result.length).toBe(0);

      jest.dontMock('@prisma/client');
    });

    test('should only return ACCEPTED friendships', async () => {
      const mockFriendships: Friendship[] = [
        {
          requesterId: mockUserId,
          addresseeId: 2,
          status: 'ACCEPTED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockFriends: User[] = [
        {
          id: 2,
          email: 'friend1@example.com',
          password_hash: 'hash',
          username: 'friend1',
          first_name: 'Friend',
          last_name: 'One',
          profilePictureUrl: null,
          latitude: null,
          longitude: null,
          role: 'CLIENT',
          ExpPoints: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockFindMany = jest.fn<() => Promise<Friendship[]>>().mockResolvedValue(mockFriendships);
      const mockUserFindMany = jest.fn<() => Promise<User[]>>().mockResolvedValue(mockFriends);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
          },
          user: {
            findMany: mockUserFindMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.getFriend(mockUserId);

      expect(result.length).toBe(1);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({ status: 'ACCEPTED' }),
            ]),
          }),
        })
      );

      jest.dontMock('@prisma/client');
    });

    test('should throw error when validation fails', async () => {
      const mockFindMany = jest.fn();

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      await expect(
        friendService.default.getFriend(-1)
      ).rejects.toThrow();

      expect(mockFindMany).not.toHaveBeenCalled();

      jest.dontMock('@prisma/client');
    });

    test('should throw error when database operation fails', async () => {
      const mockFindMany = jest.fn<() => Promise<Friendship[]>>().mockRejectedValue(new Error('Database error'));

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      await expect(
        friendService.default.getFriend(mockUserId)
      ).rejects.toThrow();

      jest.dontMock('@prisma/client');
    });
  });
});
