import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock Prisma before importing the service
const mockPrisma: any = {
  enemies: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn(),
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
  addDogEnemySchema: {
    parse: jest.fn((data) => data),
  },
  removeDogEnemySchema: {
    parse: jest.fn((data) => data),
  },
  checkDogEnemySchema: {
    parse: jest.fn((data) => data),
  },
}));

// Import AFTER all mocks are defined
import dogEnemyService from '../services/dogEnemyService';

const mockDogEnemyData = {
  id: 1,
  ownerId: 1,
  ownerDogId: 10,
  enemyDogId: 20,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Dog Enemy Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (callback: any) => callback(mockPrisma));
  });

  describe('addDogEnemy', () => {
    test('should add dog enemy successfully when no existing relationship', async () => {
      mockPrisma.enemies.count.mockResolvedValue(0);
      mockPrisma.enemies.create.mockResolvedValue(mockDogEnemyData);

      const result = await dogEnemyService.addDogEnemy(1, 10, 20);

      expect(result.enemy).toEqual(mockDogEnemyData);
      expect(result.requiresConfirmation).toBe(false);
      expect(result.blocked).toBe(false);
    });

    test('should return null if dog enemy relationship already exists', async () => {
      mockPrisma.enemies.count.mockResolvedValue(1);

      const result = await dogEnemyService.addDogEnemy(1, 10, 20);

      expect(result.enemy).toBeNull();
      expect(result.requiresConfirmation).toBe(false);
      expect(mockPrisma.enemies.create).not.toHaveBeenCalled();
    });

    test('should throw error on database failure', async () => {
      mockPrisma.enemies.count.mockRejectedValue(new Error('Database error'));

      await expect(dogEnemyService.addDogEnemy(1, 10, 20)).rejects.toThrow();
    });
  });

  describe('getDogEnemy', () => {
    test('should return all enemies for a dog', async () => {
      const mockEnemies = [mockDogEnemyData];
      mockPrisma.enemies.findMany.mockResolvedValue(mockEnemies);

      const result = await dogEnemyService.getDogEnemy(10);

      expect(result).toEqual(mockEnemies);
      expect(mockPrisma.enemies.findMany).toHaveBeenCalledWith({
        where: { ownerDogId: 10 },
        include: { enemyDog: true, ownerDog: true },
      });
    });

    test('should return empty array when dog has no enemies', async () => {
      mockPrisma.enemies.findMany.mockResolvedValue([]);

      const result = await dogEnemyService.getDogEnemy(10);

      expect(result).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      mockPrisma.enemies.findMany.mockRejectedValue(new Error('Database error'));

      await expect(dogEnemyService.getDogEnemy(10)).rejects.toThrow();
    });
  });

  describe('removeDogEnemy', () => {
    test('should remove dog enemy relationship successfully', async () => {
      mockPrisma.enemies.count.mockResolvedValue(1);
      mockPrisma.enemies.deleteMany.mockResolvedValue({ count: 1 });

      await dogEnemyService.removeDogEnemy(1, 10, 20);

      expect(mockPrisma.enemies.deleteMany).toHaveBeenCalledWith({
        where: {
          ownerId: 1,
          ownerDogId: 10,
          enemyDogId: 20,
        },
      });
    });

    test('should throw error if dog enemy relationship does not exist', async () => {
      mockPrisma.enemies.count.mockResolvedValue(0);

      await expect(dogEnemyService.removeDogEnemy(1, 10, 20)).rejects.toThrow();
    });

    test('should throw error on database failure', async () => {
      mockPrisma.enemies.count.mockRejectedValue(new Error('Database error'));

      await expect(dogEnemyService.removeDogEnemy(1, 10, 20)).rejects.toThrow();
    });
  });

  describe('isDogEnemy', () => {
    test('should return true when dogs are enemies', async () => {
      mockPrisma.enemies.count.mockResolvedValue(1);

      const result = await dogEnemyService.isDogEnemy(10, 20);

      expect(result).toBe(true);
      expect(mockPrisma.enemies.count).toHaveBeenCalledWith({
        where: {
          ownerDogId: 10,
          enemyDogId: 20,
        },
      });
    });

    test('should return false when dogs are not enemies', async () => {
      mockPrisma.enemies.count.mockResolvedValue(0);

      const result = await dogEnemyService.isDogEnemy(10, 20);

      expect(result).toBe(false);
    });

    test('should throw error on database failure', async () => {
      mockPrisma.enemies.count.mockRejectedValue(new Error('Database error'));

      await expect(dogEnemyService.isDogEnemy(10, 20)).rejects.toThrow();
    });
  });

  describe('getAllDogEnemies', () => {
    test('should return all dog enemy relationships', async () => {
      const mockEnemies = [mockDogEnemyData];
      mockPrisma.enemies.findMany.mockResolvedValue(mockEnemies);

      const result = await dogEnemyService.getAllDogEnemies();

      expect(result).toEqual(mockEnemies);
      expect(mockPrisma.enemies.findMany).toHaveBeenCalledWith({
        where: {
          ownerDogId: { not: null },
          enemyDogId: { not: null },
        },
        include: { enemyDog: true, ownerDog: true },
      });
    });

    test('should return empty array when no dog enemies exist', async () => {
      mockPrisma.enemies.findMany.mockResolvedValue([]);

      const result = await dogEnemyService.getAllDogEnemies();

      expect(result).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      mockPrisma.enemies.findMany.mockRejectedValue(new Error('Database error'));

      await expect(dogEnemyService.getAllDogEnemies()).rejects.toThrow();
    });
  });
});
