
import { expect, describe, test, beforeEach, jest } from '@jest/globals';
import type { Friendship, User, Dog } from '@prisma/client';

describe('Friend Service', () => {
  const mockRequesterId = 1;
  const mockAddresseeId = 2;
  const mockUserId = 1;
  const mockFriendId = 3;
  const mockFriendshipId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('sendFriendRequest', () => {
    test('should successfully send a friend request', async () => {
      const mockFriendship: Friendship = {
        id: mockFriendshipId,
        requesterId: mockRequesterId,
        addresseeId: mockAddresseeId,
        requesterDogId: null,
        addresseeDogId: null,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCreate = jest.fn<() => Promise<Friendship>>().mockResolvedValue(mockFriendship);

      const mockOutboxCreate = jest.fn();
      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            create: mockCreate,
          },
          outboxEvent: {
            create: mockOutboxCreate,
          },
          $transaction: jest.fn(async (callback: any) =>
            callback({
              friendship: { create: mockCreate },
              outboxEvent: { create: mockOutboxCreate },
            })
          ),
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
            requesterDogId: null,
            addresseeDogId: null,
            status: 'PENDING',
          },
        })
      );

      jest.dontMock('@prisma/client');
    });

    test('should auto-accept friend request when dog is involved', async () => {
      const mockDogId = 1;
      const mockFriendship: Friendship = {
        id: mockFriendshipId,
        requesterId: mockRequesterId,
        addresseeId: null,
        requesterDogId: null,
        addresseeDogId: mockDogId,
        status: 'ACCEPTED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCreate = jest.fn<() => Promise<Friendship>>().mockResolvedValue(mockFriendship);

      const mockOutboxCreate = jest.fn();
      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            create: mockCreate,
          },
          outboxEvent: {
            create: mockOutboxCreate,
          },
          $transaction: jest.fn(async (callback: any) =>
            callback({
              friendship: { create: mockCreate },
              outboxEvent: { create: mockOutboxCreate },
            })
          ),
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.sendFriendRequest(mockRequesterId, undefined, undefined, mockDogId);

      expect(result).toEqual(mockFriendship);
      expect(result.status).toBe('ACCEPTED');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            requesterId: mockRequesterId,
            addresseeId: null,
            requesterDogId: null,
            addresseeDogId: mockDogId,
            status: 'ACCEPTED',
          },
        })
      );
      expect(mockOutboxCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'friend.request.accepted',
        }),
      });

      jest.dontMock('@prisma/client');
    });

    test('should throw error when validation fails', async () => {
      const mockCreate = jest.fn();

      const mockOutboxCreate = jest.fn();
      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            create: mockCreate,
          },
          outboxEvent: {
            create: mockOutboxCreate,
          },
          $transaction: jest.fn(async (callback: any) =>
            callback({
              friendship: { create: mockCreate },
              outboxEvent: { create: mockOutboxCreate },
            })
          ),
        })),
      }));

      const friendService = await import('../services/friendService');

      // No requester or addressee provided
      await expect(
        friendService.default.sendFriendRequest()
      ).rejects.toThrow();

      expect(mockCreate).not.toHaveBeenCalled();

      jest.dontMock('@prisma/client');
    });

    test('should throw error when database operation fails', async () => {
      const mockCreate = jest.fn<() => Promise<Friendship>>().mockRejectedValue(new Error('Database error'));

      const mockOutboxCreate = jest.fn();
      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            create: mockCreate,
          },
          outboxEvent: {
            create: mockOutboxCreate,
          },
          $transaction: jest.fn(async (callback: any) =>
            callback({
              friendship: { create: mockCreate },
              outboxEvent: { create: mockOutboxCreate },
            })
          ),
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

      const mockOutboxCreate = jest.fn();
      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            create: mockCreate,
          },
          outboxEvent: {
            create: mockOutboxCreate,
          },
          $transaction: jest.fn(async (callback: any) =>
            callback({
              friendship: { create: mockCreate },
              outboxEvent: { create: mockOutboxCreate },
            })
          ),
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
        id: mockFriendshipId,
        requesterId: mockRequesterId,
        addresseeId: mockAddresseeId,
        requesterDogId: null,
        addresseeDogId: null,
        status: 'ACCEPTED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdate = jest.fn<() => Promise<Friendship>>().mockResolvedValue(mockUpdatedFriendship);

      const mockOutboxCreate = jest.fn();
      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            update: mockUpdate,
          },
          outboxEvent: {
            create: mockOutboxCreate,
          },
          $transaction: jest.fn(async (callback: any) =>
            callback({
              friendship: { update: mockUpdate },
              outboxEvent: { create: mockOutboxCreate },
            })
          ),
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.acceptFriendRequest(mockFriendshipId);

      expect(result).toEqual(mockUpdatedFriendship);
      expect(result.status).toBe('ACCEPTED');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockFriendshipId },
          data: { status: 'ACCEPTED' },
        })
      );

      jest.dontMock('@prisma/client');
    });

    test('should throw error when friend request does not exist', async () => {
      const mockUpdate = jest.fn<() => Promise<Friendship>>().mockRejectedValue(new Error('Record not found'));

      const mockOutboxCreate = jest.fn();
      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            update: mockUpdate,
          },
          outboxEvent: {
            create: mockOutboxCreate,
          },
          $transaction: jest.fn(async (callback: any) =>
            callback({
              friendship: { update: mockUpdate },
              outboxEvent: { create: mockOutboxCreate },
            })
          ),
        })),
      }));

      const friendService = await import('../services/friendService');

      await expect(
        friendService.default.acceptFriendRequest(mockFriendshipId)
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
        friendService.default.acceptFriendRequest(mockFriendshipId)
      ).rejects.toThrow();

      jest.dontMock('@prisma/client');
    });
  });

  describe('declineFriendRequest', () => {
    test('should successfully decline a friend request', async () => {
      const mockUpdatedFriendship: Friendship = {
        id: mockFriendshipId,
        requesterId: mockRequesterId,
        addresseeId: mockAddresseeId,
        requesterDogId: null,
        addresseeDogId: null,
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

      const result = await friendService.default.declineFriendRequest(mockFriendshipId);

      expect(result).toEqual(mockUpdatedFriendship);
      expect(result.status).toBe('REJECTED');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockFriendshipId },
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
        friendService.default.declineFriendRequest(mockFriendshipId)
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
        friendService.default.declineFriendRequest(mockFriendshipId)
      ).rejects.toThrow();

      jest.dontMock('@prisma/client');
    });
  });

  describe('removeFriend', () => {
    test('should successfully remove a friendship (requester removes addressee)', async () => {
      const mockDeleteResult = { count: 1 };

      const mockFindMany = jest.fn<() => Promise<any[]>>().mockResolvedValue([
        {
          requesterId: mockUserId,
          addresseeId: mockFriendId,
          requesterDogId: null,
          addresseeDogId: null,
        },
      ]);
      const mockDeleteMany = jest.fn<() => Promise<{ count: number }>>().mockResolvedValue(mockDeleteResult);
      const mockOutboxCreate = jest.fn();

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
            deleteMany: mockDeleteMany,
          },
          outboxEvent: {
            create: mockOutboxCreate,
          },
          $transaction: jest.fn(async (callback: any) =>
            callback({
              friendship: { findMany: mockFindMany, deleteMany: mockDeleteMany },
              outboxEvent: { create: mockOutboxCreate },
            })
          ),
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.removeFriend(mockUserId, mockFriendId);

      expect(result).toEqual(mockDeleteResult);
      expect(result.count).toBe(1);
      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              requesterId: mockUserId,
              addresseeId: mockFriendId,
              requesterDogId: null,
              addresseeDogId: null,
            },
            {
              requesterId: mockFriendId,
              addresseeId: mockUserId,
              requesterDogId: null,
              addresseeDogId: null,
            },
          ],
        },
      });
      expect(mockOutboxCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'friend.removed',
        }),
      });

      jest.dontMock('@prisma/client');
    });

    test('should successfully remove a friendship (addressee removes requester)', async () => {
      const mockDeleteResult = { count: 1 };

      const mockFindMany = jest.fn<() => Promise<any[]>>().mockResolvedValue([
        {
          requesterId: mockFriendId,
          addresseeId: mockUserId,
          requesterDogId: null,
          addresseeDogId: null,
        },
      ]);
      const mockDeleteMany = jest.fn<() => Promise<{ count: number }>>().mockResolvedValue(mockDeleteResult);
      const mockOutboxCreate = jest.fn();

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
            deleteMany: mockDeleteMany,
          },
          outboxEvent: {
            create: mockOutboxCreate,
          },
          $transaction: jest.fn(async (callback: any) =>
            callback({
              friendship: { findMany: mockFindMany, deleteMany: mockDeleteMany },
              outboxEvent: { create: mockOutboxCreate },
            })
          ),
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.removeFriend(mockFriendId, mockUserId);

      expect(result).toEqual(mockDeleteResult);
      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              requesterId: mockFriendId,
              addresseeId: mockUserId,
              requesterDogId: null,
              addresseeDogId: null,
            },
            {
              requesterId: mockUserId,
              addresseeId: mockFriendId,
              requesterDogId: null,
              addresseeDogId: null,
            },
          ],
        },
      });
      expect(mockOutboxCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'friend.removed',
        }),
      });

      jest.dontMock('@prisma/client');
    });

    test('should return count 0 when friendship does not exist', async () => {
      const mockDeleteResult = { count: 0 };

      const mockFindMany = jest.fn<() => Promise<any[]>>().mockResolvedValue([]);
      const mockDeleteMany = jest.fn<() => Promise<{ count: number }>>().mockResolvedValue(mockDeleteResult);
      const mockOutboxCreate = jest.fn();

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
            deleteMany: mockDeleteMany,
          },
          outboxEvent: {
            create: mockOutboxCreate,
          },
          $transaction: jest.fn(async (callback: any) =>
            callback({
              friendship: { findMany: mockFindMany, deleteMany: mockDeleteMany },
              outboxEvent: { create: mockOutboxCreate },
            })
          ),
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.removeFriend(mockUserId, mockFriendId);

      expect(result.count).toBe(0);
      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              requesterId: mockUserId,
              addresseeId: mockFriendId,
              requesterDogId: null,
              addresseeDogId: null,
            },
            {
              requesterId: mockFriendId,
              addresseeId: mockUserId,
              requesterDogId: null,
              addresseeDogId: null,
            },
          ],
        },
      });
      expect(mockOutboxCreate).not.toHaveBeenCalled();

      jest.dontMock('@prisma/client');
    });

    test('should throw error when validation fails', async () => {
      const mockDeleteMany = jest.fn();
      const mockFindMany = jest.fn();
      const mockOutboxCreate = jest.fn();

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
            deleteMany: mockDeleteMany,
          },
          outboxEvent: {
            create: mockOutboxCreate,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      // No entity or friend provided
      await expect(
        friendService.default.removeFriend()
      ).rejects.toThrow();

      expect(mockDeleteMany).not.toHaveBeenCalled();
      expect(mockOutboxCreate).not.toHaveBeenCalled();

      jest.dontMock('@prisma/client');
    });

    test('should throw error when database operation fails', async () => {
      const mockFindMany = jest.fn<() => Promise<any[]>>().mockResolvedValue([
        {
          requesterId: mockUserId,
          addresseeId: mockFriendId,
          requesterDogId: null,
          addresseeDogId: null,
        },
      ]);
      const mockDeleteMany = jest.fn<() => Promise<{ count: number }>>().mockRejectedValue(new Error('Database error'));
      const mockOutboxCreate = jest.fn();

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
            deleteMany: mockDeleteMany,
          },
          outboxEvent: {
            create: mockOutboxCreate,
          },
          $transaction: jest.fn(async (callback: any) =>
            callback({
              friendship: { findMany: mockFindMany, deleteMany: mockDeleteMany },
              outboxEvent: { create: mockOutboxCreate },
            })
          ),
        })),
      }));

      const friendService = await import('../services/friendService');

      await expect(
        friendService.default.removeFriend(mockUserId, mockFriendId)
      ).rejects.toThrow();

      jest.dontMock('@prisma/client');
    });

    test('should remove a user-to-dog friendship with scoped filter', async () => {
      const mockDeleteResult = { count: 1 };
      const mockFriendDogId = 7;

      const mockFindMany = jest.fn<() => Promise<any[]>>().mockResolvedValue([
        {
          requesterId: mockUserId,
          addresseeId: null,
          requesterDogId: null,
          addresseeDogId: mockFriendDogId,
        },
      ]);
      const mockDeleteMany = jest.fn<() => Promise<{ count: number }>>().mockResolvedValue(mockDeleteResult);
      const mockOutboxCreate = jest.fn();

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
            deleteMany: mockDeleteMany,
          },
          outboxEvent: {
            create: mockOutboxCreate,
          },
          $transaction: jest.fn(async (callback: any) =>
            callback({
              friendship: { findMany: mockFindMany, deleteMany: mockDeleteMany },
              outboxEvent: { create: mockOutboxCreate },
            })
          ),
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.removeFriend(mockUserId, undefined, undefined, mockFriendDogId);

      expect(result).toEqual(mockDeleteResult);
      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              requesterId: mockUserId,
              addresseeDogId: mockFriendDogId,
            },
            {
              addresseeId: mockUserId,
              requesterDogId: mockFriendDogId,
            },
          ],
        },
      });
      expect(mockOutboxCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'friend.removed',
        }),
      });

      jest.dontMock('@prisma/client');
    });
  });

  describe('getFriendsList', () => {
    test('should successfully retrieve friends list for user as requester', async () => {
      const mockFriendships = [
        {
          id: 1,
          requesterId: mockUserId,
          addresseeId: 2,
          requesterDogId: null,
          addresseeDogId: null,
          status: 'ACCEPTED',
          createdAt: new Date(),
          updatedAt: new Date(),
          requester: null,
          addressee: {
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
          requesterDog: null,
          addresseeDog: null,
        },
        {
          id: 2,
          requesterId: mockUserId,
          addresseeId: 3,
          requesterDogId: null,
          addresseeDogId: null,
          status: 'ACCEPTED',
          createdAt: new Date(),
          updatedAt: new Date(),
          requester: null,
          addressee: {
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
          requesterDog: null,
          addresseeDog: null,
        },
      ];

      const mockFindMany = jest.fn().mockResolvedValue(mockFriendships);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.getFriendsList(mockUserId);

      expect(result.users.length).toBe(2);
      expect(result.dogs.length).toBe(0);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              {
                OR: expect.arrayContaining([
                  { requesterId: mockUserId },
                  { addresseeId: mockUserId },
                ]),
              },
              { status: 'ACCEPTED' },
            ],
          },
          include: expect.objectContaining({
            requester: true,
            addressee: true,
            requesterDog: true,
            addresseeDog: true,
          }),
        })
      );

      jest.dontMock('@prisma/client');
    });

    test('should successfully retrieve friends list for user as addressee', async () => {
      const mockFriendships = [
        {
          id: 1,
          requesterId: 2,
          addresseeId: mockUserId,
          requesterDogId: null,
          addresseeDogId: null,
          status: 'ACCEPTED',
          createdAt: new Date(),
          updatedAt: new Date(),
          requester: {
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
          addressee: null,
          requesterDog: null,
          addresseeDog: null,
        },
      ];

      const mockFindMany = jest.fn().mockResolvedValue(mockFriendships);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.getFriendsList(mockUserId);

      expect(result.users.length).toBe(1);
      expect(result.dogs.length).toBe(0);

      jest.dontMock('@prisma/client');
    });

    test('should return empty arrays when user has no friends', async () => {
      const mockFriendships = [];

      const mockFindMany = jest.fn().mockResolvedValue(mockFriendships);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.getFriendsList(mockUserId);

      expect(result.users).toEqual([]);
      expect(result.dogs).toEqual([]);
      expect(result.users.length).toBe(0);
      expect(result.dogs.length).toBe(0);

      jest.dontMock('@prisma/client');
    });

    test('should only return ACCEPTED friendships', async () => {
      const mockFriendships = [
        {
          id: 1,
          requesterId: mockUserId,
          addresseeId: 2,
          requesterDogId: null,
          addresseeDogId: null,
          status: 'ACCEPTED',
          createdAt: new Date(),
          updatedAt: new Date(),
          requester: null,
          addressee: {
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
          requesterDog: null,
          addresseeDog: null,
        },
      ];

      const mockFindMany = jest.fn().mockResolvedValue(mockFriendships);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.getFriendsList(mockUserId);

      expect(result.users.length).toBe(1);
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
      const mockFriendships = [
        {
          id: 1,
          requesterId: mockUserId,
          addresseeId: 2,
          requesterDogId: null,
          addresseeDogId: null,
          status: 'ACCEPTED',
          createdAt: new Date(),
          updatedAt: new Date(),
          requester: null,
          addressee: {
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
          requesterDog: null,
          addresseeDog: null,
        },
        {
          id: 2,
          requesterId: 3,
          addresseeId: mockUserId,
          requesterDogId: null,
          addresseeDogId: null,
          status: 'ACCEPTED',
          createdAt: new Date(),
          updatedAt: new Date(),
          requester: {
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
          addressee: null,
          requesterDog: null,
          addresseeDog: null,
        },
      ];

      const mockFindMany = jest.fn().mockResolvedValue(mockFriendships);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.getFriendsList(mockUserId);

      expect(result.users.length).toBe(2);

      jest.dontMock('@prisma/client');
    });

    test('should throw error when database operation fails', async () => {
      const mockFindMany = jest.fn().mockRejectedValue(new Error('Database error'));

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

      // No userId or dogId provided
      await expect(
        friendService.default.getFriendsList()
      ).rejects.toThrow();

      expect(mockFindMany).not.toHaveBeenCalled();

      jest.dontMock('@prisma/client');
    });
  });

  describe('getFriend', () => {
    test('should successfully retrieve friends for user as requester', async () => {
      const mockFriendships = [
        {
          id: 1,
          requesterId: mockUserId,
          addresseeId: 2,
          requesterDogId: null,
          addresseeDogId: null,
          status: 'ACCEPTED',
          createdAt: new Date(),
          updatedAt: new Date(),
          requester: null,
          addressee: {
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
          requesterDog: null,
          addresseeDog: null,
        },
      ];

      const mockFindMany = jest.fn().mockResolvedValue(mockFriendships);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.getFriend(mockUserId);

      expect(result.users.length).toBe(1);
      expect(result.dogs.length).toBe(0);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              {
                OR: expect.arrayContaining([
                  { requesterId: mockUserId },
                  { addresseeId: mockUserId },
                ]),
              },
              { status: 'ACCEPTED' },
            ],
          },
          include: expect.objectContaining({
            requester: true,
            addressee: true,
            requesterDog: true,
            addresseeDog: true,
          }),
        })
      );

      jest.dontMock('@prisma/client');
    });

    test('should successfully retrieve friends for user as addressee', async () => {
      const mockFriendships = [
        {
          id: 1,
          requesterId: 2,
          addresseeId: mockUserId,
          requesterDogId: null,
          addresseeDogId: null,
          status: 'ACCEPTED',
          createdAt: new Date(),
          updatedAt: new Date(),
          requester: {
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
          addressee: null,
          requesterDog: null,
          addresseeDog: null,
        },
      ];

      const mockFindMany = jest.fn().mockResolvedValue(mockFriendships);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.getFriend(mockUserId);

      expect(result.users.length).toBe(1);
      expect(result.dogs.length).toBe(0);

      jest.dontMock('@prisma/client');
    });

    test('should return empty arrays when user has no friends', async () => {
      const mockFriendships = [];

      const mockFindMany = jest.fn().mockResolvedValue(mockFriendships);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.getFriend(mockUserId);

      expect(result.users).toEqual([]);
      expect(result.dogs).toEqual([]);
      expect(result.users.length).toBe(0);
      expect(result.dogs.length).toBe(0);

      jest.dontMock('@prisma/client');
    });

    test('should only return ACCEPTED friendships', async () => {
      const mockFriendships = [
        {
          id: 1,
          requesterId: mockUserId,
          addresseeId: 2,
          requesterDogId: null,
          addresseeDogId: null,
          status: 'ACCEPTED',
          createdAt: new Date(),
          updatedAt: new Date(),
          requester: null,
          addressee: {
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
          requesterDog: null,
          addresseeDog: null,
        },
      ];

      const mockFindMany = jest.fn().mockResolvedValue(mockFriendships);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.getFriend(mockUserId);

      expect(result.users.length).toBe(1);
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

      // No userId or dogId provided
      await expect(
        friendService.default.getFriend()
      ).rejects.toThrow();

      expect(mockFindMany).not.toHaveBeenCalled();

      jest.dontMock('@prisma/client');
    });

    test('should throw error when database operation fails', async () => {
      const mockFindMany = jest.fn().mockRejectedValue(new Error('Database error'));

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

  describe('getFriendRequests', () => {
    test('should successfully retrieve friend requests for user', async () => {
      const mockFriendRequests = [
        {
          id: 1,
          requesterId: 2,
          addresseeId: mockUserId,
          requesterDogId: null,
          addresseeDogId: null,
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
          requester: {
            id: 2,
            email: 'requester@example.com',
            password_hash: 'hash',
            username: 'requester',
            first_name: 'Request',
            last_name: 'User',
            profilePictureUrl: null,
            latitude: null,
            longitude: null,
            role: 'CLIENT',
            ExpPoints: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          addressee: {
            id: mockUserId,
            email: 'addressee@example.com',
            password_hash: 'hash',
            username: 'addressee',
            first_name: 'Addressee',
            last_name: 'User',
            profilePictureUrl: null,
            latitude: null,
            longitude: null,
            role: 'CLIENT',
            ExpPoints: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          requesterDog: null,
          addresseeDog: null,
        },
      ];

      const mockFindMany = jest.fn().mockResolvedValue(mockFriendRequests);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.getFriendRequests(mockUserId);

      expect(result).toEqual(mockFriendRequests);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              {
                OR: expect.arrayContaining([
                  { addresseeId: mockUserId },
                  { addresseeDogId: undefined },
                ]),
              },
              { status: 'PENDING' },
            ],
          },
          include: expect.objectContaining({
            requester: true,
            addressee: true,
            requesterDog: true,
            addresseeDog: true,
          }),
        })
      );

      jest.dontMock('@prisma/client');
    });

    test('should successfully retrieve friend requests for dog', async () => {
      const mockDogId = 9;
      const mockFriendRequests = [
        {
          id: 2,
          requesterId: null,
          addresseeId: null,
          requesterDogId: 4,
          addresseeDogId: mockDogId,
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
          requester: null,
          addressee: null,
          requesterDog: {
            id: 4,
            name: 'Rex',
            breed: 'LABRADOR_RETRIEVER',
            gender: 'MALE',
            age: 3,
            bio: null,
            profilePictureUrl: null,
            ownerId: 2,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          addresseeDog: {
            id: mockDogId,
            name: 'Luna',
            breed: 'GOLDEN_RETRIEVER',
            gender: 'FEMALE',
            age: 2,
            bio: null,
            profilePictureUrl: null,
            ownerId: mockUserId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      const mockFindMany = jest.fn().mockResolvedValue(mockFriendRequests);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.getFriendRequests(undefined, mockDogId);

      expect(result).toEqual(mockFriendRequests);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              {
                OR: expect.arrayContaining([
                  { addresseeId: undefined },
                  { addresseeDogId: mockDogId },
                ]),
              },
              { status: 'PENDING' },
            ],
          },
          include: expect.objectContaining({
            requester: true,
            addressee: true,
            requesterDog: true,
            addresseeDog: true,
          }),
        })
      );

      jest.dontMock('@prisma/client');
    });

    test('should return empty array when no friend requests exist', async () => {
      const mockFindMany = jest.fn().mockResolvedValue([]);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      const result = await friendService.default.getFriendRequests(mockUserId);

      expect(result).toEqual([]);

      jest.dontMock('@prisma/client');
    });

    test('should throw error when database operation fails', async () => {
      const mockFindMany = jest.fn().mockRejectedValue(new Error('Database error'));

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          friendship: {
            findMany: mockFindMany,
          },
        })),
      }));

      const friendService = await import('../services/friendService');

      await expect(
        friendService.default.getFriendRequests(mockUserId)
      ).rejects.toThrow();

      jest.dontMock('@prisma/client');
    });
  });
});