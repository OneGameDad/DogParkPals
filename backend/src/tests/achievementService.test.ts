import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock Prisma before importing the service
const mockPrisma: any = {
  achievements: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  userAchievement: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
};

const mockAchievementData = {
  id: 1,
  name: 'First Visit',
  type: 'BADGE' as const,
  description: 'Visit your first dog park',
  badgeUrl: 'https://example.com/badge.png',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUserData = {
  id: 1,
  email: 'user@example.com',
  password_hash: 'hashed',
  username: 'testuser',
  role: 'CLIENT',
  ExpPoints: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    AchievementType: {
      BADGE: 'BADGE',
      TROPHY: 'TROPHY',
      CERTIFICATE: 'CERTIFICATE',
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

// Import AFTER all mocks are defined
import achievementService from '../services/achievementService';

describe('Achievement Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllAchievements', () => {
    test('should return all achievements', async () => {
      const mockAchievements = [mockAchievementData, { ...mockAchievementData, id: 2, name: 'Second Visit' }];
      mockPrisma.achievements.findMany.mockResolvedValue(mockAchievements);

      const result = await achievementService.getAllAchievements();

      expect(result).toEqual(mockAchievements);
      expect(mockPrisma.achievements.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' }
      });
    });

    test('should return empty array when no achievements exist', async () => {
      mockPrisma.achievements.findMany.mockResolvedValue([]);

      const result = await achievementService.getAllAchievements();

      expect(result).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      mockPrisma.achievements.findMany.mockRejectedValue(new Error('DB Error'));

      await expect(achievementService.getAllAchievements()).rejects.toThrow();
    });
  });

  describe('getAchievementById', () => {
    test('should return achievement when found', async () => {
      mockPrisma.achievements.findUnique.mockResolvedValue(mockAchievementData);

      const result = await achievementService.getAchievementById(1);

      expect(result).toEqual(mockAchievementData);
      expect(mockPrisma.achievements.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    test('should throw NotFoundError when achievement not found', async () => {
      mockPrisma.achievements.findUnique.mockResolvedValue(null);

      await expect(achievementService.getAchievementById(999)).rejects.toThrow('Achievement not found');
    });

    test('should throw error on database failure', async () => {
      mockPrisma.achievements.findUnique.mockRejectedValue(new Error('DB Error'));

      await expect(achievementService.getAchievementById(1)).rejects.toThrow();
    });
  });

  describe('getAchievementByName', () => {
    test('should return achievement when found by name', async () => {
      mockPrisma.achievements.findFirst.mockResolvedValue(mockAchievementData);

      const result = await achievementService.getAchievementByName('First Visit');

      expect(result).toEqual(mockAchievementData);
      expect(mockPrisma.achievements.findFirst).toHaveBeenCalledWith({
        where: { name: 'First Visit' },
      });
    });

    test('should throw NotFoundError when achievement not found by name', async () => {
      mockPrisma.achievements.findFirst.mockResolvedValue(null);

      await expect(achievementService.getAchievementByName('Nonexistent')).rejects.toThrow('Achievement not found');
    });

    test('should throw error on database failure', async () => {
      mockPrisma.achievements.findFirst.mockRejectedValue(new Error('DB Error'));

      await expect(achievementService.getAchievementByName('First Visit')).rejects.toThrow();
    });
  });

  describe('createAchievement', () => {
    test('should create achievement successfully', async () => {
      mockPrisma.achievements.findFirst.mockResolvedValue(null);
      mockPrisma.achievements.create.mockResolvedValue(mockAchievementData);

      const result = await achievementService.createAchievement({
        name: 'First Visit',
        type: 'BADGE' as any,
        description: 'Visit your first dog park',
        badgeUrl: 'https://example.com/badge.png',
      });

      expect(result).toEqual(mockAchievementData);
      expect(mockPrisma.achievements.create).toHaveBeenCalledWith({
        data: {
          name: 'First Visit',
          type: 'BADGE',
          description: 'Visit your first dog park',
          badgeUrl: 'https://example.com/badge.png',
        },
      });
    });

    test('should throw ConflictError when achievement with same name exists', async () => {
      mockPrisma.achievements.findFirst.mockResolvedValue(mockAchievementData);

      await expect(
        achievementService.createAchievement({
          name: 'First Visit',
        })
      ).rejects.toThrow('Achievement with this name already exists');
    });

    test('should use default type when not provided', async () => {
      mockPrisma.achievements.findFirst.mockResolvedValue(null);
      mockPrisma.achievements.create.mockResolvedValue(mockAchievementData);

      await achievementService.createAchievement({
        name: 'Test Achievement',
      });

      expect(mockPrisma.achievements.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'BADGE',
        }),
      });
    });

    test('should throw error on database failure', async () => {
      mockPrisma.achievements.findFirst.mockResolvedValue(null);
      mockPrisma.achievements.create.mockRejectedValue(new Error('DB Error'));

      await expect(
        achievementService.createAchievement({
          name: 'First Visit',
        })
      ).rejects.toThrow();
    });
  });

  describe('updateAchievement', () => {
    test('should update achievement successfully', async () => {
      const updatedData = { ...mockAchievementData, description: 'Updated description' };
      mockPrisma.achievements.findUnique.mockResolvedValue(mockAchievementData);
      mockPrisma.achievements.update.mockResolvedValue(updatedData);

      const result = await achievementService.updateAchievement(1, {
        description: 'Updated description',
      });

      expect(result).toEqual(updatedData);
      expect(mockPrisma.achievements.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { description: 'Updated description' },
      });
    });

    test('should throw NotFoundError when achievement does not exist', async () => {
      mockPrisma.achievements.findUnique.mockResolvedValue(null);

      await expect(
        achievementService.updateAchievement(999, { description: 'New desc' })
      ).rejects.toThrow('Achievement not found');
    });

    test('should throw ConflictError when updating to existing name', async () => {
      mockPrisma.achievements.findUnique.mockResolvedValue(mockAchievementData);
      mockPrisma.achievements.findFirst.mockResolvedValue({ ...mockAchievementData, id: 2 });

      await expect(
        achievementService.updateAchievement(1, { name: 'Existing Name' })
      ).rejects.toThrow('Achievement with this name already exists');
    });

    test('should allow updating to same name', async () => {
      mockPrisma.achievements.findUnique.mockResolvedValue(mockAchievementData);
      mockPrisma.achievements.findFirst.mockResolvedValue(null);
      mockPrisma.achievements.update.mockResolvedValue(mockAchievementData);

      await achievementService.updateAchievement(1, { description: 'New description' });

      expect(mockPrisma.achievements.update).toHaveBeenCalled();
    });

    test('should throw error on database failure', async () => {
      mockPrisma.achievements.findUnique.mockResolvedValue(mockAchievementData);
      mockPrisma.achievements.update.mockRejectedValue(new Error('DB Error'));

      await expect(
        achievementService.updateAchievement(1, { description: 'New desc' })
      ).rejects.toThrow();
    });
  });

  describe('deleteAchievement', () => {
    test('should delete achievement successfully', async () => {
      mockPrisma.achievements.findUnique.mockResolvedValue(mockAchievementData);
      mockPrisma.achievements.delete.mockResolvedValue(mockAchievementData);

      const result = await achievementService.deleteAchievement(1);

      expect(result).toEqual({ message: 'Achievement deleted successfully' });
      expect(mockPrisma.achievements.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    test('should throw NotFoundError when achievement does not exist', async () => {
      mockPrisma.achievements.findUnique.mockResolvedValue(null);

      await expect(achievementService.deleteAchievement(999)).rejects.toThrow('Achievement not found');
    });

    test('should throw error on database failure', async () => {
      mockPrisma.achievements.findUnique.mockResolvedValue(mockAchievementData);
      mockPrisma.achievements.delete.mockRejectedValue(new Error('DB Error'));

      await expect(achievementService.deleteAchievement(1)).rejects.toThrow();
    });
  });

  describe('awardAchievementToUser', () => {
    test('should award achievement to user successfully', async () => {
      const mockUserAchievement = {
        userId: 1,
        achievementId: 1,
        dateEarned: new Date(),
        user: {
          id: 1,
          username: 'testuser',
          email: 'user@example.com',
        },
        achievement: mockAchievementData,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockPrisma.achievements.findUnique.mockResolvedValue(mockAchievementData);
      mockPrisma.userAchievement.findUnique.mockResolvedValue(null);
      mockPrisma.userAchievement.create.mockResolvedValue(mockUserAchievement);

      const result = await achievementService.awardAchievementToUser(1, 1);

      expect(result).toEqual(mockUserAchievement);
      expect(mockPrisma.userAchievement.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          achievementId: 1,
        },
        include: {
          achievement: true,
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            }
          }
        }
      });
    });

    test('should throw NotFoundError when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(achievementService.awardAchievementToUser(999, 1)).rejects.toThrow('User not found');
    });

    test('should throw NotFoundError when achievement does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockPrisma.achievements.findUnique.mockResolvedValue(null);

      await expect(achievementService.awardAchievementToUser(1, 999)).rejects.toThrow('Achievement not found');
    });

    test('should throw ConflictError when user already has achievement', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockPrisma.achievements.findUnique.mockResolvedValue(mockAchievementData);
      mockPrisma.userAchievement.findUnique.mockResolvedValue({
        userId: 1,
        achievementId: 1,
        dateEarned: new Date(),
      });

      await expect(achievementService.awardAchievementToUser(1, 1)).rejects.toThrow('User already has this achievement');
    });

    test('should throw error on database failure', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockPrisma.achievements.findUnique.mockResolvedValue(mockAchievementData);
      mockPrisma.userAchievement.findUnique.mockResolvedValue(null);
      mockPrisma.userAchievement.create.mockRejectedValue(new Error('DB Error'));

      await expect(achievementService.awardAchievementToUser(1, 1)).rejects.toThrow();
    });
  });

  describe('getUserAchievements', () => {
    test('should return user achievements successfully', async () => {
      const mockUserAchievements = [
        {
          userId: 1,
          achievementId: 1,
          dateEarned: new Date(),
          achievement: mockAchievementData,
        },
        {
          userId: 1,
          achievementId: 2,
          dateEarned: new Date(),
          achievement: { ...mockAchievementData, id: 2, name: 'Second Visit' },
        },
      ];

      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockPrisma.userAchievement.findMany.mockResolvedValue(mockUserAchievements);

      const result = await achievementService.getUserAchievements(1);

      expect(result).toEqual(mockUserAchievements);
      expect(mockPrisma.userAchievement.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: {
          achievement: true,
        },
        orderBy: { dateEarned: 'desc' }
      });
    });

    test('should throw NotFoundError when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(achievementService.getUserAchievements(999)).rejects.toThrow('User not found');
    });

    test('should return empty array when user has no achievements', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockPrisma.userAchievement.findMany.mockResolvedValue([]);

      const result = await achievementService.getUserAchievements(1);

      expect(result).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockPrisma.userAchievement.findMany.mockRejectedValue(new Error('DB Error'));

      await expect(achievementService.getUserAchievements(1)).rejects.toThrow();
    });
  });

  describe('removeAchievementFromUser', () => {
    test('should remove achievement from user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockPrisma.achievements.findUnique.mockResolvedValue(mockAchievementData);
      mockPrisma.userAchievement.findUnique.mockResolvedValue({
        userId: 1,
        achievementId: 1,
        dateEarned: new Date(),
      });
      mockPrisma.userAchievement.delete.mockResolvedValue({
        userId: 1,
        achievementId: 1,
        dateEarned: new Date(),
      });

      const result = await achievementService.removeAchievementFromUser(1, 1);

      expect(result).toEqual({ message: 'Achievement removed from user successfully' });
      expect(mockPrisma.userAchievement.delete).toHaveBeenCalledWith({
        where: {
          userId_achievementId: {
            userId: 1,
            achievementId: 1
          }
        }
      });
    });

    test('should throw NotFoundError when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(achievementService.removeAchievementFromUser(999, 1)).rejects.toThrow('User not found');
    });

    test('should throw NotFoundError when achievement does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockPrisma.achievements.findUnique.mockResolvedValue(null);

      await expect(achievementService.removeAchievementFromUser(1, 999)).rejects.toThrow('Achievement not found');
    });

    test('should throw NotFoundError when user does not have achievement', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockPrisma.achievements.findUnique.mockResolvedValue(mockAchievementData);
      mockPrisma.userAchievement.findUnique.mockResolvedValue(null);

      await expect(achievementService.removeAchievementFromUser(1, 1)).rejects.toThrow('User does not have this achievement');
    });

    test('should throw error on database failure', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockPrisma.achievements.findUnique.mockResolvedValue(mockAchievementData);
      mockPrisma.userAchievement.findUnique.mockResolvedValue({
        userId: 1,
        achievementId: 1,
        dateEarned: new Date(),
      });
      mockPrisma.userAchievement.delete.mockRejectedValue(new Error('DB Error'));

      await expect(achievementService.removeAchievementFromUser(1, 1)).rejects.toThrow();
    });
  });
});
