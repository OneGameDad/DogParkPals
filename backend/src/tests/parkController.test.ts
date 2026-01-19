import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import parkService from '../services/parkService';

// Mock parkService
const mockGetParkById = jest.fn<any>();
const mockGetParkByName = jest.fn<any>();
const mockGetParksNearLocation = jest.fn<any>();
const mockGetAllParks = jest.fn<any>();
const mockGetParksByAmenity = jest.fn<any>();
const mockCreatePark = jest.fn<any>();
const mockUpdatePark = jest.fn<any>();
const mockDeletePark = jest.fn<any>();
const mockAddParkToUserFavorites = jest.fn<any>();
const mockRemoveParkFromUserFavorites = jest.fn<any>();
const mockCheckIn = jest.fn<any>();
const mockCheckOut = jest.fn<any>();
const mockGetActiveCheckInsForPark = jest.fn<any>();
const mockParkExists = jest.fn<any>();

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
    checkIn: mockCheckIn,
    checkOut: mockCheckOut,
    getActiveCheckInsForPark: mockGetActiveCheckInsForPark,
    parkExists: mockParkExists,
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

const mockParseValidation = jest.fn();

jest.mock('../utils/validator', () => ({
  parseValidation: mockParseValidation,
}));

jest.mock('../utils/validationSchemas', () => ({
  createParkSchema: {
    parse: jest.fn((data) => data),
  },
  updateParkSchema: {
    parse: jest.fn((data) => data),
  },
  getParksNearLocationSchema: {},
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
      const error = mockNext.mock.calls[0][0] as Error;
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
      mockParseValidation.mockReturnValue({ latitude: 40.7829, longitude: -73.9654, radiusInKm: 5 });
      mockGetParksNearLocation.mockResolvedValue(nearbyParks);

      await parkController.getParksNearLocation(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockGetParksNearLocation).toHaveBeenCalledWith(40.7829, -73.9654, 5);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(nearbyParks);
    });

    test('should return empty array when no parks nearby', async () => {
      mockReq.query = { latitude: '0', longitude: '0', radiusInKm: '5' };
      mockParseValidation.mockReturnValue({ latitude: 0, longitude: 0, radiusInKm: 5 });
      mockGetParksNearLocation.mockResolvedValue([]);

      await parkController.getParksNearLocation(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith([]);
    });

    test('should handle validation error for invalid latitude', async () => {
      mockReq.query = { latitude: '95', longitude: '-73.9654', radiusInKm: '5' };
      mockParseValidation.mockImplementation(() => {
        throw new Error('Latitude must be between -90 and 90');
      });

      await parkController.getParksNearLocation(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
      expect(mockGetParksNearLocation).not.toHaveBeenCalled();
    });

    test('should handle validation error for invalid longitude', async () => {
      mockReq.query = { latitude: '40.7829', longitude: '200', radiusInKm: '5' };
      mockParseValidation.mockImplementation(() => {
        throw new Error('Longitude must be between -180 and 180');
      });

      await parkController.getParksNearLocation(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
      expect(mockGetParksNearLocation).not.toHaveBeenCalled();
    });

    test('should handle validation error for invalid radius', async () => {
      mockReq.query = { latitude: '40.7829', longitude: '-73.9654', radiusInKm: '-5' };
      mockParseValidation.mockImplementation(() => {
        throw new Error('Radius must be at least 0.1 km');
      });

      await parkController.getParksNearLocation(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
      expect(mockGetParksNearLocation).not.toHaveBeenCalled();
    });

    test('should handle service error', async () => {
      mockReq.query = { latitude: '40.7829', longitude: '-73.9654', radiusInKm: '5' };
      mockParseValidation.mockReturnValue({ latitude: 40.7829, longitude: -73.9654, radiusInKm: 5 });
      mockGetParksNearLocation.mockRejectedValue(new Error('Database error'));

      await parkController.getParksNearLocation(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
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
    test('should create park with admin role', async () => {
      mockReq.body = {
        name: 'New Park',
        latitude: 40.7580,
        longitude: -73.9855,
        description: 'A new park',
        amenities: ['water'],
      };
      (mockReq as any).user = { id: 1, role: 'ADMIN' };
      const newPark = { 
        id: 3, 
        name: 'New Park',
        latitude: 40.7580,
        longitude: -73.9855,
        description: 'A new park',
        separateSmallDogArea: false,
        amenities: ['water'],
        profilePictureUrl: null,
        createdAt: new Date(), 
        updatedAt: new Date() 
      };
      mockCreatePark.mockResolvedValue(newPark);

      await parkController.createPark(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockCreatePark).toHaveBeenCalledWith(mockReq.body);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(newPark);
    });

    test('should reject create without admin role', async () => {
      mockReq.body = {
        name: 'New Park',
        latitude: 40.7580,
        longitude: -73.9855,
      };
      (mockReq as any).user = { id: 1, role: 'CLIENT' };

      await parkController.createPark(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as Error;
      expect(error.message).toContain('Not authorized');
      expect(mockCreatePark).not.toHaveBeenCalled();
    });

    test('should allow DEVELOPER role to create', async () => {
      mockReq.body = {
        name: 'New Park',
        latitude: 40.7580,
        longitude: -73.9855,
      };
      (mockReq as any).user = { id: 1, role: 'DEVELOPER' };
      const newPark = { 
        id: 3, 
        name: 'New Park',
        latitude: 40.7580,
        longitude: -73.9855,
        separateSmallDogArea: false,
        amenities: [],
        profilePictureUrl: null,
        createdAt: new Date(), 
        updatedAt: new Date() 
      };
      mockCreatePark.mockResolvedValue(newPark);

      await parkController.createPark(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockCreatePark).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(201);
    });

    test('should handle validation error', async () => {
      mockReq.body = { name: 'Test' }; // Missing required fields
      (mockReq as any).user = { id: 1, role: 'ADMIN' };
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
      const error = mockNext.mock.calls[0][0] as Error;
      expect(error.message).toContain('Not authorized');
    });

    test('should handle park not found during update', async () => {
      mockReq.params = { id: '999' };
      mockReq.body = { name: 'Updated Park' };
      (mockReq as any).user = { id: 1, role: 'ADMIN' };
      mockGetParkById.mockResolvedValue(null);

      await parkController.updatePark(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as Error;
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
      const error = mockNext.mock.calls[0][0] as Error;
      expect(error.message).toContain('Not authorized');
    });

    test('should handle park not found during delete', async () => {
      mockReq.params = { id: '999' };
      (mockReq as any).user = { id: 1, role: 'ADMIN' };
      mockGetParkById.mockResolvedValue(null);

      await parkController.deletePark(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as Error;
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
    test('should add park to favorites for self', async () => {
      mockReq.params = { userId: '1', parkId: '1' };
      (mockReq as any).user = { id: 1, role: 'CLIENT' };
      mockParkExists.mockResolvedValue(true);
      mockAddParkToUserFavorites.mockResolvedValue(undefined);

      await parkController.addParkToUserFavorites(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockParkExists).toHaveBeenCalledWith(1);
      expect(mockAddParkToUserFavorites).toHaveBeenCalledWith(1, 1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Park added to favorites' });
    });

    test('should allow admin to add favorites for other user', async () => {
      mockReq.params = { userId: '2', parkId: '1' };
      (mockReq as any).user = { id: 1, role: 'ADMIN' };
      mockParkExists.mockResolvedValue(true);
      mockAddParkToUserFavorites.mockResolvedValue(undefined);

      await parkController.addParkToUserFavorites(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockAddParkToUserFavorites).toHaveBeenCalledWith(2, 1);
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    test('should reject adding favorites for other user without admin', async () => {
      mockReq.params = { userId: '2', parkId: '1' };
      (mockReq as any).user = { id: 1, role: 'CLIENT' };

      await parkController.addParkToUserFavorites(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as Error;
      expect(error.message).toContain('Not authorized');
      expect(mockAddParkToUserFavorites).not.toHaveBeenCalled();
    });

    test('should return 404 when park does not exist', async () => {
      mockReq.params = { userId: '1', parkId: '999' };
      (mockReq as any).user = { id: 1, role: 'CLIENT' };
      mockParkExists.mockResolvedValue(false);

      await parkController.addParkToUserFavorites(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as Error;
      expect(error.message).toContain('Park not found');
      expect(mockAddParkToUserFavorites).not.toHaveBeenCalled();
    });

    test('should handle error when adding to favorites', async () => {
      mockReq.params = { userId: '1', parkId: '1' };
      (mockReq as any).user = { id: 1, role: 'CLIENT' };
      mockParkExists.mockResolvedValue(true);
      mockAddParkToUserFavorites.mockRejectedValue(new Error('Database error'));

      await parkController.addParkToUserFavorites(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('removeParkFromUserFavorites', () => {
    test('should remove park from favorites for self', async () => {
      mockReq.params = { userId: '1', parkId: '1' };
      (mockReq as any).user = { id: 1, role: 'CLIENT' };
      mockParkExists.mockResolvedValue(true);
      mockRemoveParkFromUserFavorites.mockResolvedValue(undefined);

      await parkController.removeParkFromUserFavorites(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockParkExists).toHaveBeenCalledWith(1);
      expect(mockRemoveParkFromUserFavorites).toHaveBeenCalledWith(1, 1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Park removed from favorites' });
    });

    test('should allow admin to remove favorites for other user', async () => {
      mockReq.params = { userId: '2', parkId: '1' };
      (mockReq as any).user = { id: 1, role: 'ADMIN' };
      mockParkExists.mockResolvedValue(true);
      mockRemoveParkFromUserFavorites.mockResolvedValue(undefined);

      await parkController.removeParkFromUserFavorites(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockRemoveParkFromUserFavorites).toHaveBeenCalledWith(2, 1);
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    test('should reject removing favorites for other user without admin', async () => {
      mockReq.params = { userId: '2', parkId: '1' };
      (mockReq as any).user = { id: 1, role: 'CLIENT' };

      await parkController.removeParkFromUserFavorites(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as Error;
      expect(error.message).toContain('Not authorized');
      expect(mockRemoveParkFromUserFavorites).not.toHaveBeenCalled();
    });

    test('should return 404 when park does not exist', async () => {
      mockReq.params = { userId: '1', parkId: '999' };
      (mockReq as any).user = { id: 1, role: 'CLIENT' };
      mockParkExists.mockResolvedValue(false);

      await parkController.removeParkFromUserFavorites(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as Error;
      expect(error.message).toContain('Park not found');
      expect(mockRemoveParkFromUserFavorites).not.toHaveBeenCalled();
    });

    test('should handle error when removing from favorites', async () => {
      mockReq.params = { userId: '1', parkId: '1' };
      (mockReq as any).user = { id: 1, role: 'CLIENT' };
      mockParkExists.mockResolvedValue(true);
      mockRemoveParkFromUserFavorites.mockRejectedValue(new Error('Database error'));

      await parkController.removeParkFromUserFavorites(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('checkInAtPark', () => {
    test('should call service and return 201 with check-in info', async () => {
      mockReq.params = { parkId: '1' };
      mockReq.body = { dogId: 123 };
      (mockReq as any).user = { id: 1 };
      mockParkExists.mockResolvedValue(true);
  
      const checkInData = { id: 1, userId: 1, parkId: 1, checkedInAt: new Date() };
      mockCheckIn.mockResolvedValue(checkInData);
  
      await parkController.checkInAtPark(mockReq as Request, mockRes as Response, mockNext as any);
  
      expect(mockParkExists).toHaveBeenCalledWith(1);
      expect(mockCheckIn).toHaveBeenCalledWith(1, 1, 123);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(checkInData);
    });

    test('should return 404 when park does not exist', async () => {
      mockReq.params = { parkId: '999' };
      (mockReq as any).user = { id: 1 };
      mockParkExists.mockResolvedValue(false);

      await parkController.checkInAtPark(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as Error;
      expect(error.message).toContain('Park not found');
      expect(mockCheckIn).not.toHaveBeenCalled();
    });
  
    test('should call next if already checked in', async () => {
      mockReq.params = { parkId: '1' };
      (mockReq as any).user = { id: 1 };
      mockParkExists.mockResolvedValue(true);
      mockCheckIn.mockRejectedValue(new Error('Already checked in'));
  
      await parkController.checkInAtPark(mockReq as Request, mockRes as Response, mockNext as any);
  
      expect(mockNext).toHaveBeenCalled();
    });
  });
  
  describe('checkOutFromPark', () => {
    test('should call service and return 200 with check-out info', async () => {
      mockReq.params = { parkId: '1' };
      (mockReq as any).user = { id: 1 };
      mockParkExists.mockResolvedValue(true);
  
      const checkOutData = { id: 1, userId: 1, parkId: 1, checkedOutAt: new Date() };
      mockCheckOut.mockResolvedValue(checkOutData);
  
      await parkController.checkOutFromPark(mockReq as Request, mockRes as Response, mockNext as any);
  
      expect(mockParkExists).toHaveBeenCalledWith(1);
      expect(mockCheckOut).toHaveBeenCalledWith(1, 1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(checkOutData);
    });

    test('should return 404 when park does not exist', async () => {
      mockReq.params = { parkId: '999' };
      (mockReq as any).user = { id: 1 };
      mockParkExists.mockResolvedValue(false);

      await parkController.checkOutFromPark(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as Error;
      expect(error.message).toContain('Park not found');
      expect(mockCheckOut).not.toHaveBeenCalled();
    });
  
    test('should call next if no active check-in exists', async () => {
      mockReq.params = { parkId: '1' };
      (mockReq as any).user = { id: 1 };
      mockParkExists.mockResolvedValue(true);
      mockCheckOut.mockRejectedValue(new Error('No active check-in'));
  
      await parkController.checkOutFromPark(mockReq as Request, mockRes as Response, mockNext as any);
  
      expect(mockNext).toHaveBeenCalled();
    });
  });
  
  describe('getActiveCheckInsForPark', () => {
    test('should call service and return 200 with active check-ins', async () => {
      mockReq.params = { parkId: '1' };
      const activeCheckIns = [
        { id: 1, userId: 1, parkId: 1, checkedInAt: new Date() },
        { id: 2, userId: 2, parkId: 1, checkedInAt: new Date() },
      ];
      mockGetActiveCheckInsForPark.mockResolvedValue(activeCheckIns);
  
      await parkController.getActiveCheckInsForPark(mockReq as Request, mockRes as Response, mockNext as any);
  
      expect(mockGetActiveCheckInsForPark).toHaveBeenCalledWith(1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(activeCheckIns);
    });
  
    test('should call next on service error', async () => {
      mockReq.params = { parkId: '1' };
      mockGetActiveCheckInsForPark.mockRejectedValue(new Error('Database error'));
  
      await parkController.getActiveCheckInsForPark(mockReq as Request, mockRes as Response, mockNext as any);
  
      expect(mockNext).toHaveBeenCalled();
    });
  });
  
});
