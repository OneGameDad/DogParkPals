import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';

// Mock the auth middleware before importing the controller
jest.mock('../middlewares/authMiddleware', () => ({
  requireAuth: (req: Request, res: Response, next: NextFunction) => {
    (req as any).user = { id: 1 };
    next();
  },
}));

// Create mock functions for the service
const mockAddDogEnemy = jest.fn();
const mockGetDogEnemy = jest.fn();
const mockRemoveDogEnemy = jest.fn();
const mockIsDogEnemy = jest.fn();
const mockGetAllDogEnemies = jest.fn();

// Mock the service
jest.mock('../services/dogEnemyService', () => ({
  __esModule: true,
  default: {
    addDogEnemy: mockAddDogEnemy,
    getDogEnemy: mockGetDogEnemy,
    removeDogEnemy: mockRemoveDogEnemy,
    isDogEnemy: mockIsDogEnemy,
    getAllDogEnemies: mockGetAllDogEnemies,
  },
}));

// Mock utilities
jest.mock('../utils/typeSafeLogger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

const mockParseValidation = jest.fn((schema, data) => data);
jest.mock('../utils/validator', () => ({
  parseValidation: mockParseValidation,
}));

// Import AFTER mocks
import dogEnemyController from '../controllers/dogEnemyController';

describe('Dog Enemy Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  const mockDogEnemyData = {
    id: 1,
    ownerId: 1,
    ownerDogId: 10,
    enemyDogId: 20,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  describe('addDogEnemy', () => {
    test('should add dog enemy and return 201', async () => {
      req.body = { ownerDogId: 10, enemyDogId: 20 };
      (req as any).user = { id: 1 };

      mockAddDogEnemy.mockResolvedValue({
        requiresConfirmation: false,
        blocked: false,
        enemy: mockDogEnemyData,
      });

      await dogEnemyController.addDogEnemy(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockDogEnemyData);
    });

    test('should return 401 if user not authenticated', async () => {
      req.body = { ownerDogId: 10, enemyDogId: 20 };
      (req as any).user = undefined;

      await dogEnemyController.addDogEnemy(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeDefined();
    });

    test('should call next with error on service failure', async () => {
      req.body = { ownerDogId: 10, enemyDogId: 20 };
      (req as any).user = { id: 1 };

      mockAddDogEnemy.mockRejectedValue(new Error('Service error'));

      await dogEnemyController.addDogEnemy(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('getDogEnemy', () => {
    test('should get dog enemies and return 200', async () => {
      req.params = { dogId: '10' };
      const enemies = [mockDogEnemyData];

      mockGetDogEnemy.mockResolvedValue(enemies);

      await dogEnemyController.getDogEnemy(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(enemies);
    });

    test('should return empty array when no enemies found', async () => {
      req.params = { dogId: '10' };

      mockGetDogEnemy.mockResolvedValue([]);

      await dogEnemyController.getDogEnemy(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    test('should call next with error on service failure', async () => {
      req.params = { dogId: '10' };

      mockGetDogEnemy.mockRejectedValue(new Error('Service error'));

      await dogEnemyController.getDogEnemy(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('removeDogEnemy', () => {
    test('should remove dog enemy and return 200', async () => {
      req.body = { ownerDogId: 10, enemyDogId: 20 };
      (req as any).user = { id: 1 };

      mockRemoveDogEnemy.mockResolvedValue(undefined);

      await dogEnemyController.removeDogEnemy(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Dog enemy removed successfully',
      });
    });

    test('should return 401 if user not authenticated', async () => {
      req.body = { ownerDogId: 10, enemyDogId: 20 };
      (req as any).user = undefined;

      await dogEnemyController.removeDogEnemy(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    test('should call next with error on service failure', async () => {
      req.body = { ownerDogId: 10, enemyDogId: 20 };
      (req as any).user = { id: 1 };

      mockRemoveDogEnemy.mockRejectedValue(new Error('Service error'));

      await dogEnemyController.removeDogEnemy(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('isDogEnemy', () => {
    test('should check if dogs are enemies and return true', async () => {
      req.params = { dogId: '10', enemyDogId: '20' };

      mockIsDogEnemy.mockResolvedValue(true);

      await dogEnemyController.isDogEnemy(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ isEnemy: true });
    });

    test('should check if dogs are enemies and return false', async () => {
      req.params = { dogId: '10', enemyDogId: '20' };

      mockIsDogEnemy.mockResolvedValue(false);

      await dogEnemyController.isDogEnemy(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ isEnemy: false });
    });

    test('should call next with error on service failure', async () => {
      req.params = { dogId: '10', enemyDogId: '20' };

      mockIsDogEnemy.mockRejectedValue(new Error('Service error'));

      await dogEnemyController.isDogEnemy(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('getAllDogEnemies', () => {
    test('should get all dog enemies and return 200', async () => {
      const enemies = [mockDogEnemyData];

      mockGetAllDogEnemies.mockResolvedValue(enemies);

      await dogEnemyController.getAllDogEnemies(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(enemies);
    });

    test('should return empty array when no dog enemies exist', async () => {
      mockGetAllDogEnemies.mockResolvedValue([]);

      await dogEnemyController.getAllDogEnemies(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    test('should call next with error on service failure', async () => {
      mockGetAllDogEnemies.mockRejectedValue(new Error('Service error'));

      await dogEnemyController.getAllDogEnemies(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
