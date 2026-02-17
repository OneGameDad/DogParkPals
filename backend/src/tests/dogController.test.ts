import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { AppError, NotFoundError, ForbiddenError } from '../utils/errors';
import { awardExperience, XP_REWARDS } from '../services/xpService';

// Create mock functions
const mockAddDog = jest.fn<any>();
const mockGetDogById = jest.fn<any>();
const mockGetDogByOwner = jest.fn<any>();
const mockGetAllDogs = jest.fn<any>();
const mockGetAllDogsByPark = jest.fn<any>();
const mockUpdateDog = jest.fn<any>();
const mockDeleteDog = jest.fn<any>();
const mockAddOwnerToDog = jest.fn<any>();
const mockRemoveOwnerFromDog = jest.fn<any>();
const mockGetOwnersOfDog = jest.fn<any>();

// Mock friend service
const mockGetFriend = jest.fn<any>();

jest.mock('../services/friendService', () => ({
  __esModule: true,
  default: {
    getFriend: mockGetFriend,
  },
}));

// Mock dogService
jest.mock('../services/dogService', () => ({
  __esModule: true,
  default: {
    addDog: mockAddDog,
    getDogById: mockGetDogById,
    getDogByOwner: mockGetDogByOwner,
    getAllDogs: mockGetAllDogs,
    getAllDogsByPark: mockGetAllDogsByPark,
    updateDog: mockUpdateDog,
    deleteDog: mockDeleteDog,
    addOwnerToDog: mockAddOwnerToDog,
    removeOwnerFromDog: mockRemoveOwnerFromDog,
    getOwnersOfDog: mockGetOwnersOfDog,
  },
}));

jest.mock('../services/xpService', () => ({
  awardExperience: jest.fn(),
  XP_REWARDS: {
    ADD_DOG: 5,
    ADD_OWNER_TO_DOG: 5,
  },
}));

// Import controller after mocks
import dogController from '../controllers/dogController';

describe('Dog Controller', () => {
  let mockReq: any;
  let mockRes: any;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockSend: jest.Mock;
  let mockNext: jest.Mock;

  const mockDog = {
    id: 1,
    name: 'Rex',
    breed: 'LABRADOR_RETRIEVER',
    gender: 'MALE',
    dateOfBirth: new Date('2020-01-15'),
    fixed: false,
    size: 'LARGE',
    playstyle: 'SOCIAL',
    description: 'A friendly dog',
    profilePictureUrl: 'https://example.com/rex.jpg',
    vaccinationRecordUrl: 'https://example.com/vax.pdf',
    currentLocationId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOwner = { id: 1, username: 'owner1', email: 'owner@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();

    mockJson = jest.fn().mockReturnValue(undefined);
    mockSend = jest.fn().mockReturnValue(undefined);
    mockStatus = jest.fn().mockReturnValue({ json: mockJson, send: mockSend });

    mockReq = {
      body: {},
      params: {},
      userId: undefined,
      user: undefined,
    };

    mockRes = {
      status: mockStatus,
      json: mockJson,
      send: mockSend,
    };

    mockNext = jest.fn();
  });

  describe('addDog', () => {
    test('creates a new dog with valid data', async () => {
      mockReq.body = {
        name: 'Rex',
        breed: 'LABRADOR_RETRIEVER',
        gender: 'MALE',
        dateOfBirth: '2020-01-15T00:00:00Z',
        playstyle: 'SOCIAL',
        size: 'LARGE',
      };
      mockAddDog.mockResolvedValue(mockDog);

      await dogController.addDog(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockAddDog).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(mockDog);
      expect(mockAddOwnerToDog).not.toHaveBeenCalled();
      expect(awardExperience).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('creates dog and auto-assigns owner when userId present', async () => {
      mockReq.body = {
        name: 'Rex',
        breed: 'LABRADOR_RETRIEVER',
        gender: 'MALE',
        dateOfBirth: '2020-01-15T00:00:00Z',
        playstyle: 'SOCIAL',
        size: 'LARGE',
      };
      mockReq.userId = 42;
      mockAddDog.mockResolvedValue(mockDog);
      mockAddOwnerToDog.mockResolvedValue(undefined);

      await dogController.addDog(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockAddDog).toHaveBeenCalled();
      expect(mockAddOwnerToDog).toHaveBeenCalledWith(mockDog.id, 42);
      expect(awardExperience).toHaveBeenCalledWith(42, XP_REWARDS.ADD_DOG, 'add_dog');
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(mockDog);
    });

    test('deletes dog and forwards error if auto-assign owner fails', async () => {
      mockReq.body = {
        name: 'Rex',
        breed: 'LABRADOR_RETRIEVER',
        gender: 'MALE',
        dateOfBirth: '2020-01-15T00:00:00Z',
        playstyle: 'SOCIAL',
        size: 'LARGE',
      };
      mockReq.userId = 7;
      mockAddDog.mockResolvedValue(mockDog);
      mockAddOwnerToDog.mockRejectedValue(new Error('owner insert failed'));
      mockDeleteDog.mockResolvedValue(undefined);

      await dogController.addDog(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockAddOwnerToDog).toHaveBeenCalledWith(mockDog.id, 7);
      expect(mockDeleteDog).toHaveBeenCalledWith(mockDog.id);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockStatus).not.toHaveBeenCalled();
    });

    test('forwards validation error when required fields are missing', async () => {
      mockReq.body = { name: 'Rex' };

      await dogController.addDog(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockAddDog).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
    });

    test('forwards error when service fails', async () => {
      mockReq.body = {
        name: 'Rex',
        breed: 'LABRADOR_RETRIEVER',
        gender: 'MALE',
        dateOfBirth: '2020-01-15T00:00:00Z',
        playstyle: 'SOCIAL',
        size: 'LARGE',
      };
      mockAddDog.mockRejectedValue(new Error('Database error'));

      await dogController.addDog(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDogById', () => {
    test('retrieves dog by ID successfully', async () => {
      mockReq.params = { id: '1' };
      mockGetDogById.mockResolvedValue(mockDog);

      await dogController.getDogById(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockGetDogById).toHaveBeenCalledWith(1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockDog);
    });

    test('forwards NotFoundError when dog is missing', async () => {
      mockReq.params = { id: '999' };
      mockGetDogById.mockResolvedValue(null);

      await dogController.getDogById(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
    });
  });

  describe('getDogByOwner', () => {
    test('retrieves dogs by owner ID', async () => {
      mockReq.params = { ownerId: '1' };
      const dogs = [mockDog];
      mockGetDogByOwner.mockResolvedValue(dogs);

      await dogController.getDogByOwner(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockGetDogByOwner).toHaveBeenCalledWith(1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(dogs);
    });
    test('returns empty array when owner has no dogs', async () => {
      mockReq.params = { ownerId: '1' };
      mockGetDogByOwner.mockResolvedValue([]);

      await dogController.getDogByOwner(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockJson).toHaveBeenCalledWith([]);
    });
  });

  describe('getAllDogs', () => {
    test('retrieves all dogs successfully', async () => {
      const dogs = [mockDog, { ...mockDog, id: 2, name: 'Bella' }];
      mockGetAllDogs.mockResolvedValue(dogs);

      await dogController.getAllDogs(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockGetAllDogs).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(dogs);
    });
  });

  describe('getAllDogsByPark', () => {
    test('retrieves dogs at a specific park', async () => {
      mockReq.params = { parkId: '10' };
      const dogs = [mockDog];
      mockGetAllDogsByPark.mockResolvedValue(dogs);

      await dogController.getAllDogsByPark(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockGetAllDogsByPark).toHaveBeenCalledWith(10);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(dogs);
    });
  });

  describe('updateDog', () => {
    test('updates dog when user is owner', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = { name: 'Rex Jr' };
      mockReq.userId = 1;
      (mockReq as any).user = { id: 1, role: 'CLIENT' };
      mockGetDogById.mockResolvedValue(mockDog);
      mockGetOwnersOfDog.mockResolvedValue([mockOwner]);
      mockUpdateDog.mockResolvedValue({ ...mockDog, name: 'Rex Jr' });

      await dogController.updateDog(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockGetOwnersOfDog).toHaveBeenCalledWith(1);
      expect(mockUpdateDog).toHaveBeenCalledWith(1, { name: 'Rex Jr' });
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    test('updates dog when user is admin', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = { name: 'Rex Jr' };
      mockReq.userId = 99;
      (mockReq as any).user = { id: 99, role: 'ADMIN' };
      mockGetDogById.mockResolvedValue(mockDog);
      mockGetOwnersOfDog.mockResolvedValue([mockOwner]);
      mockUpdateDog.mockResolvedValue({ ...mockDog, name: 'Rex Jr' });

      await dogController.updateDog(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockUpdateDog).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    test('updates dog when user is developer', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = { name: 'Rex Jr' };
      mockReq.userId = 99;
      (mockReq as any).user = { id: 99, role: 'DEVELOPER' };
      mockGetDogById.mockResolvedValue(mockDog);
      mockGetOwnersOfDog.mockResolvedValue([mockOwner]);
      mockUpdateDog.mockResolvedValue({ ...mockDog, name: 'Rex Jr' });

      await dogController.updateDog(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockUpdateDog).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    test('forwards ForbiddenError when user is not owner or admin', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = { name: 'Rex Jr' };
      mockReq.userId = 99;
      (mockReq as any).user = { id: 99, role: 'CLIENT' };
      mockGetDogById.mockResolvedValue(mockDog);
      mockGetOwnersOfDog.mockResolvedValue([mockOwner]);

      await dogController.updateDog(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockUpdateDog).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(403);
    });

    test('forwards NotFoundError when dog does not exist', async () => {
      mockReq.params = { id: '999' };
      mockReq.body = { name: 'Updated' };
      mockReq.userId = 1;
      (mockReq as any).user = { id: 1, role: 'CLIENT' };
      mockGetDogById.mockResolvedValue(null);

      await dogController.updateDog(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(404);
    });
  });

  describe('deleteDog', () => {
    test('deletes dog when user is owner', async () => {
      mockReq.params = { id: '1' };
      mockReq.userId = 1;
      (mockReq as any).user = { id: 1, role: 'CLIENT' };
      mockGetDogById.mockResolvedValue(mockDog);
      mockGetOwnersOfDog.mockResolvedValue([mockOwner]);
      mockDeleteDog.mockResolvedValue(undefined);

      await dogController.deleteDog(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockDeleteDog).toHaveBeenCalledWith(1);
      expect(mockStatus).toHaveBeenCalledWith(204);
      expect(mockSend).toHaveBeenCalled();
    });

    test('forwards ForbiddenError when user is not authorized', async () => {
      mockReq.params = { id: '1' };
      mockReq.userId = 99;
      (mockReq as any).user = { id: 99, role: 'CLIENT' };
      mockGetDogById.mockResolvedValue(mockDog);
      mockGetOwnersOfDog.mockResolvedValue([mockOwner]);

      await dogController.deleteDog(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockDeleteDog).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(403);
    });
  });

  describe('addOwnerToDog', () => {
    test('adds owner when user is authorized and are friends', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = { userId: 2 };
      mockReq.userId = 1;
      (mockReq as any).user = { id: 1, role: 'CLIENT' };
      mockGetDogById.mockResolvedValue(mockDog);
      mockGetOwnersOfDog.mockResolvedValue([mockOwner]);
      mockGetFriend.mockResolvedValue({ users: [{ id: 2, username: 'friend', email: 'friend@example.com' }], dogs: [] });
      mockAddOwnerToDog.mockResolvedValue(undefined);

      await dogController.addOwnerToDog(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockAddOwnerToDog).toHaveBeenCalledWith(1, 2);
      expect(awardExperience).toHaveBeenCalledWith(1, XP_REWARDS.ADD_OWNER_TO_DOG, 'add_owner_to_dog');
      expect(mockStatus).toHaveBeenCalledWith(204);
    });

    test('forwards ForbiddenError when users are not friends', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = { userId: 2 };
      mockReq.userId = 1;
      (mockReq as any).user = { id: 1, role: 'CLIENT' };
      mockGetDogById.mockResolvedValue(mockDog);
      mockGetOwnersOfDog.mockResolvedValue([mockOwner]);
      mockGetFriend.mockResolvedValue({ users: [], dogs: [] });

      await dogController.addOwnerToDog(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockAddOwnerToDog).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(403);
    });

    test('forwards ForbiddenError when user is not authorized', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = { userId: 2 };
      mockReq.userId = 99;
      (mockReq as any).user = { id: 99, role: 'CLIENT' };
      mockGetDogById.mockResolvedValue(mockDog);
      mockGetOwnersOfDog.mockResolvedValue([mockOwner]);

      await dogController.addOwnerToDog(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockAddOwnerToDog).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeOwnerFromDog', () => {
    test('removes owner when user is authorized', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = { userId: 2 };
      mockReq.userId = 1;
      (mockReq as any).user = { id: 1, role: 'CLIENT' };
      mockGetDogById.mockResolvedValue(mockDog);
      mockGetOwnersOfDog.mockResolvedValue([mockOwner]);
      mockRemoveOwnerFromDog.mockResolvedValue(undefined);

      await dogController.removeOwnerFromDog(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRemoveOwnerFromDog).toHaveBeenCalledWith(1, 2);
      expect(mockStatus).toHaveBeenCalledWith(204);
      expect(mockSend).toHaveBeenCalled();
    });

    test('forwards ForbiddenError when user is not authorized', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = { userId: 2 };
      mockReq.userId = 99;
      (mockReq as any).user = { id: 99, role: 'CLIENT' };
      mockGetDogById.mockResolvedValue(mockDog);
      mockGetOwnersOfDog.mockResolvedValue([mockOwner]);

      await dogController.removeOwnerFromDog(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRemoveOwnerFromDog).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });
});
