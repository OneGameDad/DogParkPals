import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { NotFoundError, ForbiddenError } from '../utils/errors';

// Mock parkService
const mockGetParkById = jest.fn();
const mockGetParkByName = jest.fn();
const mockGetParksNearLocation = jest.fn();
const mockGetAllParks = jest.fn();
const mockGetParksByAmenity = jest.fn();
const mockCreatePark = jest.fn();
const mockUpdatePark = jest.fn();
const mockDeletePark = jest.fn();
const mockAddParkToUserFavorites = jest.fn();
const mockRemoveParkFromUserFavorites = jest.fn();

jest.mock('../services/parkService', () => ({
  __esModule: true,
  default: {
    getParkById: mockGetParkById,
    getParkByName: mockGetParkByName,
    getParksNearLocation: mockGetParksNearLocation,
    getAllParks: mockGetAllParks,
    getParksByAmenity: mockGetParksByAmenity,
    createPark: mockCreatePark,
    updatePark: mockUpdatePark,
    deletePark: mockDeletePark,
    addParkToUserFavorites: mockAddParkToUserFavorites,
    removeParkFromUserFavorites: mockRemoveParkFromUserFavorites,
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
  createParkSchema: {
    parse: jest.fn((data) => data),
  },
  updateParkSchema: {
    parse: jest.fn((data) => data),
  },
}));

// Import after all mocks
import parkController from '../controllers/parkController';

const mockParkData = {
  id: 1,
  name: 'Central Dog Park',
  latitude: 40.7829,
  longitude: -73.9654,
  description: 'A great park',
  separateSmallDogArea: true,
  amenities: ['water', 'benches'],
  profilePictureUrl: 'https://example.com/park.jpg',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Park Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockJson = jest.fn().mockReturnValue(undefined);
    mockStatus = jest.fn().mockReturnValue({ json: mockJson, send: jest.fn() });

    mockReq = {
      body: {},
      params: {},
      query: {},
      method: 'GET',
      path: '/parks',
    };

    mockRes = {
      status: mockStatus,
      json: mockJson,
      send: jest.fn(),
    };

    mockNext = jest.fn();
  });

  describe('getParkById', () => {
    test('should return park when found', async () => {
      mockReq.params = { id: '1' };
      mockGetParkById.mockResolvedValue(mockParkData);

      await parkController.getParkById(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockGetParkById).toHaveBeenCalledWith(1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockParkData);
    });

    test('should return 404 when park not found', async () => {
      mockReq.params = { id: '999' };
      mockGetParkById.mockResolvedValue(null);

      await parkController.getParkById(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toContain('Park not found');
    });

    test('should handle service errors', async () => {
      mockReq.params = { id: '1' };
      mockGetParkById.mockRejectedValue(new Error('Database error'));

      await parkController.getParkById(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('getParkByName', () => {
    test('should return park when found by name', async () => {
      mockReq.params = { name: 'Central Dog Park' };
      mockGetParkByName.mockResolvedValue(mockParkData);

      await parkController.getParkByName(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockGetParkByName).toHaveBeenCalledWith('Central Dog Park');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockParkData);
    });

    test('should return 404 when park not found by name', async () => {
      mockReq.params = { name: 'Nonexistent Park' };
      mockGetParkByName.mockResolvedValue(null);

      await parkController.getParkByName(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('getParksNearLocation', () => {
    test('should return nearby parks', async () => {
      mockReq.query = { latitude: '40.7829', longitude: '-73.9654', radiusInKm: '5' };
      const nearbyParks = [mockParkData];
      mockGetParksNearLocation.mockResolvedValue(nearbyParks);

      await parkController.getParksNearLocation(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockGetParksNearLocation).toHaveBeenCalledWith(40.7829, -73.9654, 5);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(nearbyParks);
    });

    test('should return empty array when no parks nearby', async () => {
      mockReq.query = { latitude: '0', longitude: '0', radiusInKm: '5' };
      mockGetParksNearLocation.mockResolvedValue([]);

      await parkController.getParksNearLocation(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith([]);
    });
  });

  describe('getParksByAmenity', () => {
    test('should return parks with amenity', async () => {
      mockReq.query = { amenity: 'water' };
      const parks = [mockParkData];
      mockGetParksByAmenity.mockResolvedValue(parks);

      await parkController.getParksByAmenity(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockGetParksByAmenity).toHaveBeenCalledWith('water');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(parks);
    });

    test('should return empty array when no parks have amenity', async () => {
      mockReq.query = { amenity: 'playground' };
      mockGetParksByAmenity.mockResolvedValue([]);

      await parkController.getParksByAmenity(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith([]);
    });
  });

  describe('getAllParks', () => {
    test('should return all parks', async () => {
      const parks = [mockParkData, { ...mockParkData, id: 2, name: 'North Park' }];
      mockGetAllParks.mockResolvedValue(parks);

      await parkController.getAllParks(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockGetAllParks).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(parks);
    });

    test('should return empty array when no parks exist', async () => {
      mockGetAllParks.mockResolvedValue([]);

      await parkController.getAllParks(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith([]);
    });
  });

  describe('createPark', () => {
    test('should create park with valid data', async () => {
      mockReq.body = {
        name: 'New Park',
        latitude: 40.7580,
        longitude: -73.9855,
        description: 'A new park',
        amenities: ['water'],
      };
      const newPark = { id: 3, ...mockReq.body, createdAt: new Date(), updatedAt: new Date() };
      mockCreatePark.mockResolvedValue(newPark);

      await parkController.createPark(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockCreatePark).toHaveBeenCalledWith(mockReq.body);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(newPark);
    });

    test('should handle validation error', async () => {
      mockReq.body = { name: 'Test' }; // Missing required fields
      mockCreatePark.mockRejectedValue(new Error('Validation failed'));

      await parkController.createPark(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('updatePark', () => {
    test('should update park with admin role', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = { name: 'Updated Park' };
      (mockReq as any).user = { id: 1, role: 'ADMIN' };
      const updatedPark = { ...mockParkData, name: 'Updated Park' };
      mockGetParkById.mockResolvedValue(mockParkData);
      mockUpdatePark.mockResolvedValue(updatedPark);

      await parkController.updatePark(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockUpdatePark).toHaveBeenCalledWith(1, mockReq.body);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(updatedPark);
    });

    test('should reject update without admin role', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = { name: 'Updated Park' };
      (mockReq as any).user = { id: 1, role: 'CLIENT' };
      mockGetParkById.mockResolvedValue(mockParkData);

      await parkController.updatePark(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toContain('Not authorized');
    });

    test('should handle park not found during update', async () => {
      mockReq.params = { id: '999' };
      mockReq.body = { name: 'Updated Park' };
      (mockReq as any).user = { id: 1, role: 'ADMIN' };
      mockGetParkById.mockResolvedValue(null);

      await parkController.updatePark(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toContain('Park not found');
    });
  });

  describe('deletePark', () => {
    test('should delete park with admin role', async () => {
      mockReq.params = { id: '1' };
      (mockReq as any).user = { id: 1, role: 'ADMIN' };
      mockGetParkById.mockResolvedValue(mockParkData);
      mockDeletePark.mockResolvedValue(undefined);

      await parkController.deletePark(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockDeletePark).toHaveBeenCalledWith(1);
      expect(mockStatus).toHaveBeenCalledWith(204);
    });

    test('should reject delete without admin role', async () => {
      mockReq.params = { id: '1' };
      (mockReq as any).user = { id: 1, role: 'CLIENT' };
      mockGetParkById.mockResolvedValue(mockParkData);

      await parkController.deletePark(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toContain('Not authorized');
    });

    test('should handle park not found during delete', async () => {
      mockReq.params = { id: '999' };
      (mockReq as any).user = { id: 1, role: 'ADMIN' };
      mockGetParkById.mockResolvedValue(null);

      await parkController.deletePark(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toContain('Park not found');
    });

    test('should allow DEVELOPER role to delete', async () => {
      mockReq.params = { id: '1' };
      (mockReq as any).user = { id: 1, role: 'DEVELOPER' };
      mockGetParkById.mockResolvedValue(mockParkData);
      mockDeletePark.mockResolvedValue(undefined);

      await parkController.deletePark(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockDeletePark).toHaveBeenCalledWith(1);
      expect(mockStatus).toHaveBeenCalledWith(204);
    });
  });

  describe('addParkToUserFavorites', () => {
    test('should add park to favorites', async () => {
      mockReq.params = { userId: '1', parkId: '1' };
      mockAddParkToUserFavorites.mockResolvedValue(undefined);

      await parkController.addParkToUserFavorites(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockAddParkToUserFavorites).toHaveBeenCalledWith(1, 1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Park added to favorites' });
    });

    test('should handle error when adding to favorites', async () => {
      mockReq.params = { userId: '1', parkId: '1' };
      mockAddParkToUserFavorites.mockRejectedValue(new Error('Database error'));

      await parkController.addParkToUserFavorites(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('removeParkFromUserFavorites', () => {
    test('should remove park from favorites', async () => {
      mockReq.params = { userId: '1', parkId: '1' };
      mockRemoveParkFromUserFavorites.mockResolvedValue(undefined);

      await parkController.removeParkFromUserFavorites(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockRemoveParkFromUserFavorites).toHaveBeenCalledWith(1, 1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Park removed from favorites' });
    });

    test('should handle error when removing from favorites', async () => {
      mockReq.params = { userId: '1', parkId: '1' };
      mockRemoveParkFromUserFavorites.mockRejectedValue(new Error('Database error'));

      await parkController.removeParkFromUserFavorites(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
