import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';

// Mock achievementService
const mockGetAllAchievements = jest.fn<any>();
const mockGetAchievementById = jest.fn<any>();
const mockGetAchievementByName = jest.fn<any>();
const mockCreateAchievement = jest.fn<any>();
const mockUpdateAchievement = jest.fn<any>();
const mockDeleteAchievement = jest.fn<any>();
const mockAwardAchievementToUser = jest.fn<any>();
const mockGetUserAchievements = jest.fn<any>();
const mockRemoveAchievementFromUser = jest.fn<any>();

jest.mock('../services/achievementService', () => ({
  __esModule: true,
  default: {
    getAllAchievements: mockGetAllAchievements,
    getAchievementById: mockGetAchievementById,
    getAchievementByName: mockGetAchievementByName,
    createAchievement: mockCreateAchievement,
    updateAchievement: mockUpdateAchievement,
    deleteAchievement: mockDeleteAchievement,
    awardAchievementToUser: mockAwardAchievementToUser,
    getUserAchievements: mockGetUserAchievements,
    removeAchievementFromUser: mockRemoveAchievementFromUser,
  },
}));

// Mock utilities
jest.mock('../utils/typeSafeLogger', () => ({
  __esModule: true,
  default: {
    logRequest: jest.fn(),
    logUserAction: jest.fn(),
    logError: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../utils/validationSchemas', () => ({
  createAchievementSchema: {
    parse: jest.fn((data) => data),
  },
  updateAchievementSchema: {
    parse: jest.fn((data) => data),
  },
  awardAchievementSchema: {
    parse: jest.fn((data) => data),
  },
}));

// Import after all mocks
import achievementController from '../controllers/achievementController';

const mockAchievementData = {
  id: 1,
  name: 'First Visit',
  type: 'BADGE' as const,
  description: 'Visit your first dog park',
  badgeUrl: 'https://example.com/badge.png',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Achievement Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockSend: jest.Mock;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockJson = jest.fn().mockReturnValue(undefined);
    mockSend = jest.fn().mockReturnValue(undefined);
    mockStatus = jest.fn().mockReturnValue({ json: mockJson, send: mockSend });

    mockReq = {
      body: {},
      params: {},
      query: {},
      user: undefined,
    } as any;

    mockRes = {
      json: mockJson,
      status: mockStatus,
      send: mockSend,
    };

    mockNext = jest.fn();
  });

  describe('getAllAchievements', () => {
    test('should return all achievements', async () => {
      const mockAchievements = [mockAchievementData, { ...mockAchievementData, id: 2 }];
      mockGetAllAchievements.mockResolvedValue(mockAchievements);

      await achievementController.getAllAchievements(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockGetAllAchievements).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockAchievements);
    });

    test('should handle errors', async () => {
      mockGetAllAchievements.mockRejectedValue(new Error('DB Error'));

      await achievementController.getAllAchievements(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getAchievementById', () => {
    test('should return achievement by id', async () => {
      mockReq.params = { id: '1' };
      mockGetAchievementById.mockResolvedValue(mockAchievementData);

      await achievementController.getAchievementById(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockGetAchievementById).toHaveBeenCalledWith(1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockAchievementData);
    });

    test('should handle not found error', async () => {
      mockReq.params = { id: '999' };
      mockGetAchievementById.mockRejectedValue(NotFoundError('Achievement not found'));

      await achievementController.getAchievementById(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Achievement not found',
      }));
    });

    test('should handle errors', async () => {
      mockReq.params = { id: '1' };
      mockGetAchievementById.mockRejectedValue(new Error('DB Error'));

      await achievementController.getAchievementById(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getAchievementByName', () => {
    test('should return achievement by name', async () => {
      mockReq.query = { name: 'First Visit' };
      mockGetAchievementByName.mockResolvedValue(mockAchievementData);

      await achievementController.getAchievementByName(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockGetAchievementByName).toHaveBeenCalledWith('First Visit');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockAchievementData);
    });

    test('should handle missing name parameter', async () => {
      mockReq.query = {};

      await achievementController.getAchievementByName(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Achievement name is required',
      }));
    });

    test('should handle not found error', async () => {
      mockReq.query = { name: 'Nonexistent' };
      mockGetAchievementByName.mockRejectedValue(NotFoundError('Achievement not found'));

      await achievementController.getAchievementByName(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Achievement not found',
      }));
    });
  });

  describe('createAchievement', () => {
    test('should create achievement as admin', async () => {
      mockReq.user = { role: 'ADMIN' } as any;
      mockReq.body = {
        name: 'First Visit',
        type: 'BADGE',
        description: 'Visit your first dog park',
      };
      mockCreateAchievement.mockResolvedValue(mockAchievementData);

      await achievementController.createAchievement(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockCreateAchievement).toHaveBeenCalledWith({
        name: 'First Visit',
        type: 'BADGE',
        description: 'Visit your first dog park',
        badgeUrl: undefined,
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(mockAchievementData);
    });

    test('should create achievement as developer', async () => {
      mockReq.user = { role: 'DEVELOPER' } as any;
      mockReq.body = {
        name: 'First Visit',
      };
      mockCreateAchievement.mockResolvedValue(mockAchievementData);

      await achievementController.createAchievement(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockCreateAchievement).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(201);
    });

    test('should reject creation as non-admin user', async () => {
      mockReq.user = { role: 'CLIENT' } as any;
      mockReq.body = {
        name: 'First Visit',
      };

      await achievementController.createAchievement(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Not authorized to perform this action',
      }));
      expect(mockCreateAchievement).not.toHaveBeenCalled();
    });

    test('should handle conflict error', async () => {
      mockReq.user = { role: 'ADMIN' } as any;
      mockReq.body = {
        name: 'Existing Achievement',
      };
      mockCreateAchievement.mockRejectedValue(ConflictError('Achievement with this name already exists'));

      await achievementController.createAchievement(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Achievement with this name already exists',
      }));
    });
  });

  describe('updateAchievement', () => {
    test('should update achievement as admin', async () => {
      mockReq.user = { role: 'ADMIN' } as any;
      mockReq.params = { id: '1' };
      mockReq.body = { description: 'Updated description' };
      const updatedAchievement = { ...mockAchievementData, description: 'Updated description' };
      mockUpdateAchievement.mockResolvedValue(updatedAchievement);

      await achievementController.updateAchievement(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockUpdateAchievement).toHaveBeenCalledWith(1, {
        name: undefined,
        type: undefined,
        description: 'Updated description',
        badgeUrl: undefined,
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(updatedAchievement);
    });

    test('should update achievement as developer', async () => {
      mockReq.user = { role: 'DEVELOPER' } as any;
      mockReq.params = { id: '1' };
      mockReq.body = { name: 'New Name' };
      mockUpdateAchievement.mockResolvedValue(mockAchievementData);

      await achievementController.updateAchievement(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockUpdateAchievement).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    test('should reject update as non-admin user', async () => {
      mockReq.user = { role: 'CLIENT' } as any;
      mockReq.params = { id: '1' };
      mockReq.body = { description: 'Updated' };

      await achievementController.updateAchievement(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Not authorized to perform this action',
      }));
      expect(mockUpdateAchievement).not.toHaveBeenCalled();
    });

    test('should handle not found error', async () => {
      mockReq.user = { role: 'ADMIN' } as any;
      mockReq.params = { id: '999' };
      mockReq.body = { description: 'Updated' };
      mockUpdateAchievement.mockRejectedValue(NotFoundError('Achievement not found'));

      await achievementController.updateAchievement(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Achievement not found',
      }));
    });
  });

  describe('deleteAchievement', () => {
    test('should delete achievement as admin', async () => {
      mockReq.user = { role: 'ADMIN' } as any;
      mockReq.params = { id: '1' };
      mockDeleteAchievement.mockResolvedValue({ message: 'Achievement deleted successfully' });

      await achievementController.deleteAchievement(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockDeleteAchievement).toHaveBeenCalledWith(1);
      expect(mockStatus).toHaveBeenCalledWith(204);
      expect(mockSend).toHaveBeenCalled();
    });

    test('should delete achievement as developer', async () => {
      mockReq.user = { role: 'DEVELOPER' } as any;
      mockReq.params = { id: '1' };
      mockDeleteAchievement.mockResolvedValue({ message: 'Achievement deleted successfully' });

      await achievementController.deleteAchievement(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockDeleteAchievement).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(204);
    });

    test('should reject delete as non-admin user', async () => {
      mockReq.user = { role: 'CLIENT' } as any;
      mockReq.params = { id: '1' };

      await achievementController.deleteAchievement(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Not authorized to perform this action',
      }));
      expect(mockDeleteAchievement).not.toHaveBeenCalled();
    });

    test('should handle not found error', async () => {
      mockReq.user = { role: 'ADMIN' } as any;
      mockReq.params = { id: '999' };
      mockDeleteAchievement.mockRejectedValue(NotFoundError('Achievement not found'));

      await achievementController.deleteAchievement(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Achievement not found',
      }));
    });
  });

  describe('awardAchievementToUser', () => {
    test('should award achievement to user as admin', async () => {
      mockReq.user = { role: 'ADMIN' } as any;
      mockReq.body = { userId: 1, achievementId: 1 };
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
      mockAwardAchievementToUser.mockResolvedValue(mockUserAchievement);

      await achievementController.awardAchievementToUser(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockAwardAchievementToUser).toHaveBeenCalledWith(1, 1);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(mockUserAchievement);
    });

    test('should award achievement to user as developer', async () => {
      mockReq.user = { role: 'DEVELOPER' } as any;
      mockReq.body = { userId: 1, achievementId: 1 };
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
      mockAwardAchievementToUser.mockResolvedValue(mockUserAchievement);

      await achievementController.awardAchievementToUser(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockAwardAchievementToUser).toHaveBeenCalledWith(1, 1);
      expect(mockStatus).toHaveBeenCalledWith(201);
    });

    test('should reject awarding as non-admin user', async () => {
      mockReq.user = { role: 'CLIENT' } as any;
      mockReq.body = { userId: 1, achievementId: 1 };

      await achievementController.awardAchievementToUser(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Not authorized to perform this action',
      }));
      expect(mockAwardAchievementToUser).not.toHaveBeenCalled();
    });

    test('should handle not found error for user', async () => {
      mockReq.user = { role: 'ADMIN' } as any;
      mockReq.body = { userId: 999, achievementId: 1 };
      mockAwardAchievementToUser.mockRejectedValue(NotFoundError('User not found'));

      await achievementController.awardAchievementToUser(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User not found',
      }));
    });

    test('should handle not found error for achievement', async () => {
      mockReq.user = { role: 'ADMIN' } as any;
      mockReq.body = { userId: 1, achievementId: 999 };
      mockAwardAchievementToUser.mockRejectedValue(NotFoundError('Achievement not found'));

      await achievementController.awardAchievementToUser(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Achievement not found',
      }));
    });

    test('should handle conflict when user already has achievement', async () => {
      mockReq.user = { role: 'ADMIN' } as any;
      mockReq.body = { userId: 1, achievementId: 1 };
      mockAwardAchievementToUser.mockRejectedValue(ConflictError('User already has this achievement'));

      await achievementController.awardAchievementToUser(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User already has this achievement',
      }));
    });
  });

  describe('getUserAchievements', () => {
    test('should return user achievements', async () => {
      mockReq.params = { userId: '1' };
      const mockUserAchievements = [
        {
          userId: 1,
          achievementId: 1,
          dateEarned: new Date(),
          achievement: mockAchievementData,
        },
      ];
      mockGetUserAchievements.mockResolvedValue(mockUserAchievements);

      await achievementController.getUserAchievements(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockGetUserAchievements).toHaveBeenCalledWith(1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockUserAchievements);
    });

    test('should return empty array when user has no achievements', async () => {
      mockReq.params = { userId: '1' };
      mockGetUserAchievements.mockResolvedValue([]);

      await achievementController.getUserAchievements(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith([]);
    });

    test('should handle not found error', async () => {
      mockReq.params = { userId: '999' };
      mockGetUserAchievements.mockRejectedValue(NotFoundError('User not found'));

      await achievementController.getUserAchievements(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User not found',
      }));
    });

    test('should handle errors', async () => {
      mockReq.params = { userId: '1' };
      mockGetUserAchievements.mockRejectedValue(new Error('DB Error'));

      await achievementController.getUserAchievements(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('removeAchievementFromUser', () => {
    test('should remove achievement from user as admin', async () => {
      mockReq.user = { role: 'ADMIN' } as any;
      mockReq.params = { userId: '1', achievementId: '1' };
      mockRemoveAchievementFromUser.mockResolvedValue({ message: 'Achievement removed from user successfully' });

      await achievementController.removeAchievementFromUser(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRemoveAchievementFromUser).toHaveBeenCalledWith(1, 1);
      expect(mockStatus).toHaveBeenCalledWith(204);
      expect(mockSend).toHaveBeenCalled();
    });

    test('should remove achievement from user as developer', async () => {
      mockReq.user = { role: 'DEVELOPER' } as any;
      mockReq.params = { userId: '1', achievementId: '1' };
      mockRemoveAchievementFromUser.mockResolvedValue({ message: 'Achievement removed from user successfully' });

      await achievementController.removeAchievementFromUser(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRemoveAchievementFromUser).toHaveBeenCalledWith(1, 1);
      expect(mockStatus).toHaveBeenCalledWith(204);
    });

    test('should reject removal as non-admin user', async () => {
      mockReq.user = { role: 'CLIENT' } as any;
      mockReq.params = { userId: '1', achievementId: '1' };

      await achievementController.removeAchievementFromUser(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Not authorized to perform this action',
      }));
      expect(mockRemoveAchievementFromUser).not.toHaveBeenCalled();
    });

    test('should handle not found error when user does not exist', async () => {
      mockReq.user = { role: 'ADMIN' } as any;
      mockReq.params = { userId: '999', achievementId: '1' };
      mockRemoveAchievementFromUser.mockRejectedValue(NotFoundError('User not found'));

      await achievementController.removeAchievementFromUser(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User not found',
      }));
    });

    test('should handle not found error when achievement does not exist', async () => {
      mockReq.user = { role: 'ADMIN' } as any;
      mockReq.params = { userId: '1', achievementId: '999' };
      mockRemoveAchievementFromUser.mockRejectedValue(NotFoundError('Achievement not found'));

      await achievementController.removeAchievementFromUser(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Achievement not found',
      }));
    });

    test('should handle not found error when user does not have achievement', async () => {
      mockReq.user = { role: 'ADMIN' } as any;
      mockReq.params = { userId: '1', achievementId: '1' };
      mockRemoveAchievementFromUser.mockRejectedValue(NotFoundError('User does not have this achievement'));

      await achievementController.removeAchievementFromUser(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User does not have this achievement',
      }));
    });

    test('should handle errors', async () => {
      mockReq.user = { role: 'ADMIN' } as any;
      mockReq.params = { userId: '1', achievementId: '1' };
      mockRemoveAchievementFromUser.mockRejectedValue(new Error('DB Error'));

      await achievementController.removeAchievementFromUser(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
