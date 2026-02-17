import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { CreateEventOptions } from '../events/createDomainEvent';

// Mock Prisma before importing the service
const mockPrisma: any = {
  enemies: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
  friendship: {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  outboxEvent: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockEnemyData = {
  id: 1,
  ownerId: 1,
  ownerDogId: null,
  enemyUserId: 2,
  enemyDogId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

jest.mock('@prisma/client', () => {
  const mockPrismaClientKnownRequestError = class {
    code: string;
    constructor(code: string) {
      this.code = code;
    }
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
    Prisma: {
      PrismaClientKnownRequestError: mockPrismaClientKnownRequestError,
    },
  };
});

// Mock friendService
const mockGetFriend = jest.fn<any>();
jest.mock('../services/friendService', () => ({
  __esModule: true,
  default: {
    getFriend: mockGetFriend,
  },
}));

// Mock utilities
jest.mock('../utils/typeSafeLogger', () => ({
  __esModule: true,
  default: {
    logUserAction: jest.fn(),
    logError: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../utils/validationSchemas', () => ({
  addEnemySchema: {
    parse: jest.fn((data) => data),
  },
  removeEnemySchema: {
    parse: jest.fn((data) => data),
  },
  checkEnemySchema: {
    parse: jest.fn((data) => data),
  },
  getUserIdSchema: {
    parse: jest.fn((data) => data),
  },
}));

const mockCreateDomainEvent = jest.fn((type: string, payload: any, options: CreateEventOptions = {}) => ({
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

// Import AFTER all mocks are defined
import enemyService from '../services/enemyService';

describe('Enemy Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addEnemy', () => {
    test('should add enemy when user is not a friend', async () => {
      mockGetFriend.mockResolvedValue({ users: [], dogs: [] });
      mockPrisma.enemies.count.mockResolvedValue(0);
      mockPrisma.enemies.create.mockResolvedValue(mockEnemyData);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockPrisma);
      });

      const result = await enemyService.addEnemy(1, 2);

      expect(result.requiresConfirmation).toBe(false);
      expect(result.blocked).toBe(false);
      expect(result.enemy).toEqual(mockEnemyData);
      expect(mockPrisma.enemies.create).toHaveBeenCalledWith({
        data: { ownerId: 1, enemyUserId: 2 },
      });
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'test-event-id',
          type: 'enemy.added',
          actorId: 1,
        }),
      });
    });

    test('should require confirmation when user is a friend', async () => {
      mockGetFriend.mockResolvedValue({ users: [{ id: 2, username: 'friend' }], dogs: [] });

      const result = await enemyService.addEnemy(1, 2);

      expect(result.requiresConfirmation).toBe(true);
      expect(result.blocked).toBe(true);
      expect(result.existingRelationship).toBe('friend');
      expect(result.message).toContain('currently your friend');
      expect(mockPrisma.enemies.create).not.toHaveBeenCalled();
    });

    test('should return existing enemy when already enemies', async () => {
      mockGetFriend.mockResolvedValue({ users: [], dogs: [] });
      mockPrisma.enemies.count.mockResolvedValue(1);

      const result = await enemyService.addEnemy(1, 2);

      expect(result.requiresConfirmation).toBe(false);
      expect(result.blocked).toBe(false);
      expect(result.enemy).toBeNull();
      expect(mockPrisma.enemies.create).not.toHaveBeenCalled();
    });

    test('should throw error when database operation fails', async () => {
      mockGetFriend.mockResolvedValue({ users: [], dogs: [] });
      mockPrisma.enemies.count.mockResolvedValue(0);
      mockPrisma.enemies.create.mockRejectedValue(new Error('Database error'));

      await expect(enemyService.addEnemy(1, 2)).rejects.toThrow();
    });
  });

  describe('confirmAddEnemy', () => {
    test('should remove friend and add enemy atomically', async () => {
      mockGetFriend.mockResolvedValue({ users: [{ id: 2, username: 'friend' }], dogs: [] });
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockPrisma);
      });
      mockPrisma.friendship.findMany.mockResolvedValue([
        {
          requesterId: 1,
          addresseeId: 2,
          requesterDogId: null,
          addresseeDogId: null,
        },
      ]);
      mockPrisma.friendship.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.enemies.create.mockResolvedValue(mockEnemyData);

      const result = await enemyService.confirmAddEnemy(1, 2);

      expect(result).toEqual(mockEnemyData);
      expect(mockPrisma.friendship.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { requesterId: 1, addresseeId: 2 },
            { requesterId: 2, addresseeId: 1 }
          ]
        }
      });
      expect(mockPrisma.enemies.create).toHaveBeenCalledWith({
        data: { ownerId: 1, enemyUserId: 2 },
      });
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'test-event-id',
          type: 'enemy.added',
          actorId: 1,
        }),
      });
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'test-event-id',
          type: 'friend.removed',
          actorId: 1,
        }),
      });
    });

    test('should throw error when user is not a friend', async () => {
      mockGetFriend.mockResolvedValue({ users: [], dogs: [] });

      await expect(enemyService.confirmAddEnemy(1, 2)).rejects.toThrow();
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    test('should throw error when transaction fails', async () => {
      mockGetFriend.mockResolvedValue({ users: [{ id: 2, username: 'friend' }], dogs: [] });
      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'));

      await expect(enemyService.confirmAddEnemy(1, 2)).rejects.toThrow();
    });
  });

  describe('getEnemy', () => {
    test('should return enemies for user', async () => {
      const enemies = [
        { ...mockEnemyData, enemyUser: { id: 2, username: 'enemy1' } },
        { ...mockEnemyData, id: 2, enemyUserId: 3, enemyUser: { id: 3, username: 'enemy2' } },
      ];
      mockPrisma.enemies.findMany.mockResolvedValue(enemies);

      const result = await enemyService.getEnemy(1);

      expect(result).toEqual(enemies);
      expect(result.length).toBe(2);
      expect(mockPrisma.enemies.findMany).toHaveBeenCalledWith({
        where: { ownerId: 1 },
        include: { enemyUser: true },
      });
    });

    test('should return empty array when user has no enemies', async () => {
      mockPrisma.enemies.findMany.mockResolvedValue([]);

      const result = await enemyService.getEnemy(1);

      expect(result).toEqual([]);
    });

    test('should throw error when database operation fails', async () => {
      mockPrisma.enemies.findMany.mockRejectedValue(new Error('Database error'));

      await expect(enemyService.getEnemy(1)).rejects.toThrow();
    });
  });

  describe('removeEnemy', () => {
    test('should remove enemy successfully', async () => {
      mockPrisma.enemies.count.mockResolvedValue(1);
      mockPrisma.enemies.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockPrisma);
      });

      await enemyService.removeEnemy(1, 2);

      expect(mockPrisma.enemies.deleteMany).toHaveBeenCalledWith({
        where: {
          ownerId: 1,
          enemyUserId: 2,
        },
      });
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'test-event-id',
          type: 'enemy.removed',
          actorId: 1,
        }),
      });
    });

    test('should throw error when enemy relationship does not exist', async () => {
      mockPrisma.enemies.count.mockResolvedValue(0);

      await expect(enemyService.removeEnemy(1, 2)).rejects.toThrow();
      expect(mockPrisma.enemies.deleteMany).not.toHaveBeenCalled();
    });

    test('should throw error when deletion fails', async () => {
      mockPrisma.enemies.count.mockResolvedValue(1);
      mockPrisma.enemies.deleteMany.mockRejectedValue(new Error('Deletion failed'));

      await expect(enemyService.removeEnemy(1, 2)).rejects.toThrow();
    });
  });

  describe('isEnemy', () => {
    test('should return true when enemy relationship exists', async () => {
      mockPrisma.enemies.count.mockResolvedValue(1);

      const result = await enemyService.isEnemy(1, 2);

      expect(result).toBe(true);
      expect(mockPrisma.enemies.count).toHaveBeenCalledWith({
        where: {
          ownerId: 1,
          enemyUserId: 2,
        },
      });
    });

    test('should return false when enemy relationship does not exist', async () => {
      mockPrisma.enemies.count.mockResolvedValue(0);

      const result = await enemyService.isEnemy(1, 2);

      expect(result).toBe(false);
    });

    test('should throw error when count operation fails', async () => {
      mockPrisma.enemies.count.mockRejectedValue(new Error('Database error'));

      await expect(enemyService.isEnemy(1, 2)).rejects.toThrow();
    });
  });

  describe('getAllEnemies', () => {
    test('should return all enemy relationships', async () => {
      const allEnemies = [
        { 
          ...mockEnemyData, 
          enemyUser: { id: 2, username: 'enemy1' },
          owner: { id: 1, username: 'user1' }
        },
        { 
          ...mockEnemyData, 
          id: 2,
          ownerId: 3,
          enemyUserId: 4,
          enemyUser: { id: 4, username: 'enemy2' },
          owner: { id: 3, username: 'user2' }
        },
      ];
      mockPrisma.enemies.findMany.mockResolvedValue(allEnemies);

      const result = await enemyService.getAllEnemies();

      expect(result).toEqual(allEnemies);
      expect(result.length).toBe(2);
      expect(mockPrisma.enemies.findMany).toHaveBeenCalledWith({
        include: { enemyUser: true, owner: true },
      });
    });

    test('should return empty array when no enemies exist', async () => {
      mockPrisma.enemies.findMany.mockResolvedValue([]);

      const result = await enemyService.getAllEnemies();

      expect(result).toEqual([]);
    });

    test('should throw error when database operation fails', async () => {
      mockPrisma.enemies.findMany.mockRejectedValue(new Error('Database error'));

      await expect(enemyService.getAllEnemies()).rejects.toThrow();
    });
  });
});
