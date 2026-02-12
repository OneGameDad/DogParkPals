import { expect, describe, test, beforeEach, jest } from '@jest/globals';
import type { Levels, User } from '@prisma/client';

describe('XP Service', () => {
  const mockUserId = 1;
  const mockLevelId = 1;
  const mockAmount = 50;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('awardExperience', () => {
    test('should award experience to user and update level', async () => {
      const mockLevel: Levels = {
        id: mockLevelId,
        name: 'Beginner',
        description: 'Starting out',
        minPoints: 0,
        maxPoints: 100,
        badgeUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedUser = {
        id: mockUserId,
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hash',
        first_name: 'Test',
        last_name: 'User',
        profilePictureUrl: 'http://example.com/pic.jpg',
        latitude: 40.7,
        longitude: -73.9,
        role: 'CLIENT',
        ExpPoints: mockAmount,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as User;

      const mockFindFirst = jest.fn().mockResolvedValue(mockLevel);
      const mockUpdate = jest.fn().mockResolvedValue(mockUpdatedUser);
      const mockDeleteMany = jest.fn().mockResolvedValue({});
      const mockUpsert = jest.fn().mockResolvedValue({});

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          user: {
            update: mockUpdate,
          },
          levels: {
            findFirst: mockFindFirst,
          },
          userLevel: {
            deleteMany: mockDeleteMany,
            upsert: mockUpsert,
          },
          achievements: {
            findMany: jest.fn(),
          },
          userAchievement: {
            upsert: jest.fn(),
          },
          $transaction: jest.fn((callback) => callback({
            user: { update: mockUpdate },
            levels: { findFirst: mockFindFirst },
            userLevel: { deleteMany: mockDeleteMany, upsert: mockUpsert },
            achievements: { findMany: jest.fn() },
            userAchievement: { upsert: jest.fn() },
          })),
        })),
        AchievementType: {
          BADGE: 'BADGE',
          TROPHY: 'TROPHY',
          CERTIFICATE: 'CERTIFICATE',
        },
      }));

      const xpService = await import('../services/xpService');

      const result = await xpService.awardExperience(mockUserId, mockAmount, 'test_action');

      expect(result.totalExp).toBe(mockAmount);
      expect(result.level).toEqual(mockLevel);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUserId },
          data: { ExpPoints: { increment: mockAmount } },
        })
      );

      jest.dontMock('@prisma/client');
    });

    test('should return zero experience when amount is zero or negative', async () => {
      const mockTransaction = jest.fn().mockImplementation((callback) =>
        callback({
          user: { update: jest.fn() },
          levels: { findFirst: jest.fn() },
          userLevel: { deleteMany: jest.fn(), upsert: jest.fn() },
        })
      );

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          $transaction: mockTransaction,
        })),
        AchievementType: {
          BADGE: 'BADGE',
          TROPHY: 'TROPHY',
          CERTIFICATE: 'CERTIFICATE',
        },
      }));

      const xpService = await import('../services/xpService');

      const result = await xpService.awardExperience(mockUserId, -10, 'test_action');

      expect(result.totalExp).toBe(0);
      expect(result.level).toBeNull();

      jest.dontMock('@prisma/client');
    });

    test('should throw error on database failure', async () => {
      const mockTransaction = jest.fn().mockRejectedValue(new Error('Database error'));

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          $transaction: mockTransaction,
        })),
        AchievementType: {
          BADGE: 'BADGE',
          TROPHY: 'TROPHY',
          CERTIFICATE: 'CERTIFICATE',
        },
      }));

      const xpService = await import('../services/xpService');

      await expect(
        xpService.awardExperience(mockUserId, mockAmount, 'test_action')
      ).rejects.toThrow();

      jest.dontMock('@prisma/client');
    });
  });

  describe('hasVisitedParkBefore', () => {
    test('should return true when user has visited park before', async () => {
      const mockParkId = 5;

      const mockCount = jest.fn().mockResolvedValue(1);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          checkIn: {
            count: mockCount,
          },
        })),
        AchievementType: {
          BADGE: 'BADGE',
          TROPHY: 'TROPHY',
          CERTIFICATE: 'CERTIFICATE',
        },
      }));

      const xpService = await import('../services/xpService');

      const result = await xpService.hasVisitedParkBefore(mockUserId, mockParkId);

      expect(result).toBe(true);
      expect(mockCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            parkId: mockParkId,
          }),
        })
      );

      jest.dontMock('@prisma/client');
    });

    test('should return false when user has not visited park', async () => {
      const mockParkId = 5;

      const mockCount = jest.fn().mockResolvedValue(0);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          checkIn: {
            count: mockCount,
          },
        })),
        AchievementType: {
          BADGE: 'BADGE',
          TROPHY: 'TROPHY',
          CERTIFICATE: 'CERTIFICATE',
        },
      }));

      const xpService = await import('../services/xpService');

      const result = await xpService.hasVisitedParkBefore(mockUserId, mockParkId);

      expect(result).toBe(false);
      expect(mockCount).toHaveBeenCalled();

      jest.dontMock('@prisma/client');
    });

    test('should exclude specific check-in ID when provided', async () => {
      const mockParkId = 5;
      const mockCheckInId = 10;

      const mockCount = jest.fn().mockResolvedValue(0);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          checkIn: {
            count: mockCount,
          },
        })),
        AchievementType: {
          BADGE: 'BADGE',
          TROPHY: 'TROPHY',
          CERTIFICATE: 'CERTIFICATE',
        },
      }));

      const xpService = await import('../services/xpService');

      await xpService.hasVisitedParkBefore(mockUserId, mockParkId, mockCheckInId);

      expect(mockCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { not: mockCheckInId },
          }),
        })
      );

      jest.dontMock('@prisma/client');
    });
  });

  describe('awardAchievement', () => {
    test('should look up achievement ID and delegate awarding', async () => {
      const mockAchievement = { id: 12, name: 'Pup Pal', type: 'BADGE' };
      const mockFindFirst = jest.fn().mockResolvedValue(mockAchievement);
      const mockAward = jest.fn().mockResolvedValue({});

      jest.doMock('../services/achievementService', () => ({
        __esModule: true,
        default: {
          awardAchievementToUser: mockAward,
        },
      }));

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          achievements: {
            findFirst: mockFindFirst,
          },
        })),
        AchievementType: {
          BADGE: 'BADGE',
          TROPHY: 'TROPHY',
          CERTIFICATE: 'CERTIFICATE',
        },
      }));

      const xpService = await import('../services/xpService');

      const result = await xpService.awardAchievement(mockUserId, 'Pup Pal', 'BADGE' as any);

      expect(result).toEqual(mockAchievement);
      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          name: 'Pup Pal',
          type: 'BADGE',
        },
      });
      expect(mockAward).toHaveBeenCalledWith(mockUserId, mockAchievement.id, undefined);
      jest.dontMock('@prisma/client');
      jest.dontMock('../services/achievementService');
    });

    test('should return null when achievement not found', async () => {
      const mockFindFirst = jest.fn().mockResolvedValue(null);
      const mockAward = jest.fn();

      jest.doMock('../services/achievementService', () => ({
        __esModule: true,
        default: {
          awardAchievementToUser: mockAward,
        },
      }));

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          achievements: {
            findFirst: mockFindFirst,
          },
        })),
        AchievementType: {
          BADGE: 'BADGE',
          TROPHY: 'TROPHY',
          CERTIFICATE: 'CERTIFICATE',
        },
      }));

      const xpService = await import('../services/xpService');

      const result = await xpService.awardAchievement(mockUserId, 'Missing', 'BADGE' as any);

      expect(result).toBeNull();
      expect(mockAward).not.toHaveBeenCalled();
      jest.dontMock('@prisma/client');
      jest.dontMock('../services/achievementService');
    });
  });

  describe('XP_REWARDS constants', () => {
    test('should have correct reward values', async () => {
      const xpService = await import('../services/xpService');

      expect(xpService.XP_REWARDS.LOGIN).toBe(5);
      expect(xpService.XP_REWARDS.ADD_DOG).toBe(50);
      expect(xpService.XP_REWARDS.ADD_OWNER_TO_DOG).toBe(20);
      expect(xpService.XP_REWARDS.JOIN_EVENT).toBe(5);
      expect(xpService.XP_REWARDS.CREATE_EVENT).toBe(15);
      expect(xpService.XP_REWARDS.MESSAGE_FRIEND).toBe(1);
      expect(xpService.XP_REWARDS.ADD_ENEMY).toBe(25);
      expect(xpService.XP_REWARDS.JOIN_ORGANIZATION).toBe(40);
      expect(xpService.XP_REWARDS.ADD_FRIEND).toBe(25);
      expect(xpService.XP_REWARDS.PARK_VISIT).toBe(10);
      expect(xpService.XP_REWARDS.NEW_PARK_BONUS).toBe(30);
    });
  });
});
