import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock Prisma before importing the service
const mockPrisma: any = {
  park: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  userFavoritePark: {
    create: jest.fn(),
    deleteMany: jest.fn(),
    findMany: jest.fn(),
  },
  $queryRaw: jest.fn(),
  outboxEvent: {
    create: jest.fn(),
  },
  $transaction: jest.fn(async (callback: any) => callback(mockPrisma)),
};

const mockParkData = {
  id: 1,
  name: 'Central Dog Park',
  latitude: 40.7829,
  longitude: -73.9654,
  description: 'A great park for dogs',
  separateSmallDogArea: true,
  amenities: ['water', 'benches', 'shade'],
  profilePictureUrl: 'https://example.com/park.jpg',
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
      sql: (strings: TemplateStringsArray, ...values: any[]) => ({ strings, values }),
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
  createParkSchema: {
    parse: jest.fn((data) => data),
  },
  updateParkSchema: {
    parse: jest.fn((data) => data),
  },
}));

const mockCreateDomainEvent = jest.fn((type, payload, options) => ({
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
import parkService from '../services/parkService';

describe('Park Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getParkById', () => {
    test('should return park when found', async () => {
      mockPrisma.park.findUnique.mockResolvedValue(mockParkData);

      const result = await parkService.getParkById(1);

      expect(result).toEqual(mockParkData);
      expect(mockPrisma.park.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    test('should return null when park not found', async () => {
      mockPrisma.park.findUnique.mockResolvedValue(null);

      const result = await parkService.getParkById(999);

      expect(result).toBeNull();
      expect(mockPrisma.park.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });

    test('should throw error when database operation fails', async () => {
      mockPrisma.park.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(parkService.getParkById(1)).rejects.toThrow();
    });
  });

  describe('getParkByName', () => {
    test('should return park when found by name', async () => {
      mockPrisma.park.findFirst.mockResolvedValue(mockParkData);

      const result = await parkService.getParkByName('Central Dog Park');

      expect(result).toEqual(mockParkData);
      expect(mockPrisma.park.findFirst).toHaveBeenCalledWith({
        where: { name: 'Central Dog Park' },
      });
    });

    test('should return null when park not found by name', async () => {
      mockPrisma.park.findFirst.mockResolvedValue(null);

      const result = await parkService.getParkByName('Nonexistent Park');

      expect(result).toBeNull();
    });

    test('should throw error when database operation fails', async () => {
      mockPrisma.park.findFirst.mockRejectedValue(new Error('Database error'));

      await expect(parkService.getParkByName('Central Dog Park')).rejects.toThrow();
    });
  });

  describe('getParksNearLocation', () => {
    test('should return nearby parks within radius', async () => {
      const nearbyParks = [
        { ...mockParkData, distance: 1.5 },
        { ...mockParkData, id: 2, name: 'North Park', distance: 3.2 },
      ];
      mockPrisma.$queryRaw.mockResolvedValue(nearbyParks);

      const result = await parkService.getParksNearLocation(40.7829, -73.9654, 5);

      expect(result).toEqual(nearbyParks);
      expect(result.length).toBe(2);
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    test('should return empty array when no parks nearby', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await parkService.getParksNearLocation(0, 0, 5);

      expect(result).toEqual([]);
    });

    test('should throw error when query fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Query error'));

      await expect(parkService.getParksNearLocation(40.7829, -73.9654, 5)).rejects.toThrow();
    });
  });

  describe('getAllParks', () => {
    test('should return all parks', async () => {
      const parks = [mockParkData, { ...mockParkData, id: 2, name: 'North Park' }];
      mockPrisma.park.findMany.mockResolvedValue(parks);

      const result = await parkService.getAllParks();

      expect(result).toEqual(parks);
      expect(result.length).toBe(2);
      expect(mockPrisma.park.findMany).toHaveBeenCalled();
    });

    test('should return empty array when no parks exist', async () => {
      mockPrisma.park.findMany.mockResolvedValue([]);

      const result = await parkService.getAllParks();

      expect(result).toEqual([]);
    });

    test('should throw error when database operation fails', async () => {
      mockPrisma.park.findMany.mockRejectedValue(new Error('Database error'));

      await expect(parkService.getAllParks()).rejects.toThrow();
    });
  });

  describe('getParksByAmenity', () => {
    test('should return parks with specified amenity', async () => {
      const parks = [
        { ...mockParkData, amenities: ['water', 'benches'] },
        { ...mockParkData, id: 2, name: 'North Park', amenities: ['water', 'shade'] },
      ];
      mockPrisma.park.findMany.mockResolvedValue(parks);

      const result = await parkService.getParksByAmenity('water');

      expect(result.length).toBe(2);
      expect(result.every(p => Array.isArray(p.amenities) && p.amenities.includes('water'))).toBe(true);
    });

    test('should filter out parks without the amenity', async () => {
      const parks = [
        { ...mockParkData, amenities: ['water', 'benches'] },
        { ...mockParkData, id: 2, name: 'North Park', amenities: ['shade'] },
      ];
      mockPrisma.park.findMany.mockResolvedValue(parks);

      const result = await parkService.getParksByAmenity('water');

      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Central Dog Park');
    });

    test('should return empty array when no parks have the amenity', async () => {
      const parks = [{ ...mockParkData, amenities: ['benches'] }];
      mockPrisma.park.findMany.mockResolvedValue(parks);

      const result = await parkService.getParksByAmenity('playground');

      expect(result).toEqual([]);
    });

    test('should handle parks with null amenities', async () => {
      const parks = [
        { ...mockParkData, amenities: null },
        { ...mockParkData, id: 2, amenities: ['water'] },
      ];
      mockPrisma.park.findMany.mockResolvedValue(parks);

      const result = await parkService.getParksByAmenity('water');

      expect(result.length).toBe(1);
      expect(result[0].id).toBe(2);
    });

    test('should throw error when database operation fails', async () => {
      mockPrisma.park.findMany.mockRejectedValue(new Error('Database error'));

      await expect(parkService.getParksByAmenity('water')).rejects.toThrow();
    });
  });

  describe('createPark', () => {
    test('should create a park with valid data', async () => {
      const newParkData = {
        name: 'New Park',
        latitude: 40.7580,
        longitude: -73.9855,
        description: 'A new park',
        separateSmallDogArea: false,
        amenities: ['water'],
      };
      mockPrisma.park.create.mockResolvedValue({ id: 3, ...newParkData, createdAt: new Date(), updatedAt: new Date() });

      const result = await parkService.createPark(newParkData);

      expect(result.name).toBe('New Park');
      expect(mockPrisma.park.create).toHaveBeenCalledWith({
        data: newParkData,
      });
    });

    test('should create park with minimal required fields', async () => {
      const minimalData = {
        name: 'Minimal Park',
        latitude: 40.7580,
        longitude: -73.9855,
      };
      mockPrisma.park.create.mockResolvedValue({ id: 4, ...minimalData, createdAt: new Date(), updatedAt: new Date() });

      const result = await parkService.createPark(minimalData);

      expect(result.name).toBe('Minimal Park');
      expect(mockPrisma.park.create).toHaveBeenCalled();
    });

    test('should throw error when creation fails', async () => {
      mockPrisma.park.create.mockRejectedValue(new Error('Creation failed'));

      await expect(parkService.createPark({
        name: 'Test Park',
        latitude: 40.7580,
        longitude: -73.9855,
      })).rejects.toThrow();
    });
  });

  describe('updatePark', () => {
    test('should update park with valid data', async () => {
      const updates = { name: 'Updated Park Name', description: 'Updated description' };
      const updatedPark = { ...mockParkData, ...updates };
      mockPrisma.park.update.mockResolvedValue(updatedPark);

      const result = await parkService.updatePark(1, updates);

      expect(result.name).toBe('Updated Park Name');
      expect(mockPrisma.park.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updates,
      });
    });

    test('should update park location', async () => {
      const updates = { latitude: 41.0, longitude: -74.0 };
      const updatedPark = { ...mockParkData, ...updates };
      mockPrisma.park.update.mockResolvedValue(updatedPark);

      const result = await parkService.updatePark(1, updates);

      expect(result.latitude).toBe(41.0);
      expect(result.longitude).toBe(-74.0);
    });

    test('should update park amenities', async () => {
      const updates = { amenities: ['water', 'benches', 'playground'] };
      const updatedPark = { ...mockParkData, ...updates };
      mockPrisma.park.update.mockResolvedValue(updatedPark);

      const result = await parkService.updatePark(1, updates);

      expect(result.amenities).toContain('playground');
    });

    test('should throw error when park not found', async () => {
      mockPrisma.park.update.mockRejectedValue(new Error('Park not found'));

      await expect(parkService.updatePark(999, { name: 'Test' })).rejects.toThrow();
    });

    test('should throw error when update fails', async () => {
      mockPrisma.park.update.mockRejectedValue(new Error('Update failed'));

      await expect(parkService.updatePark(1, { name: 'Test' })).rejects.toThrow();
    });
  });

  describe('deletePark', () => {
    test('should delete park successfully', async () => {
      mockPrisma.park.findUnique.mockResolvedValue({ id: 1, name: 'Central Dog Park' });
      mockPrisma.userFavoritePark.findMany.mockResolvedValue([{ userId: 2 }, { userId: 3 }]);
      mockPrisma.park.delete.mockResolvedValue(mockParkData);

      await parkService.deletePark(1);

      expect(mockPrisma.park.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'test-event-id',
          type: 'park.deleted',
        }),
      });
    });

    test('should throw error when park not found', async () => {
      mockPrisma.park.findUnique.mockResolvedValue(null);
      mockPrisma.userFavoritePark.findMany.mockResolvedValue([]);
      mockPrisma.park.delete.mockRejectedValue(new Error('Park not found'));

      await expect(parkService.deletePark(999)).rejects.toThrow();
    });

    test('should throw error when deletion fails', async () => {
      mockPrisma.park.findUnique.mockResolvedValue({ id: 1, name: 'Central Dog Park' });
      mockPrisma.userFavoritePark.findMany.mockResolvedValue([]);
      mockPrisma.park.delete.mockRejectedValue(new Error('Deletion failed'));

      await expect(parkService.deletePark(1)).rejects.toThrow();
    });
  });

  describe('parkExists', () => {
    test('should return true when park exists', async () => {
      mockPrisma.park.count.mockResolvedValue(1);

      const result = await parkService.parkExists(1);

      expect(result).toBe(true);
      expect(mockPrisma.park.count).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    test('should return false when park does not exist', async () => {
      mockPrisma.park.count.mockResolvedValue(0);

      const result = await parkService.parkExists(999);

      expect(result).toBe(false);
    });

    test('should throw error when count operation fails', async () => {
      mockPrisma.park.count.mockRejectedValue(new Error('Database error'));

      await expect(parkService.parkExists(1)).rejects.toThrow();
    });
  });

  describe('addParkToUserFavorites', () => {
    test('should add park to user favorites successfully', async () => {
      mockPrisma.userFavoritePark.create.mockResolvedValue({ userId: 1, parkId: 1 });

      await parkService.addParkToUserFavorites(1, 1);

      expect(mockPrisma.userFavoritePark.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          parkId: 1,
        },
      });
    });

    test('should throw error when user or park does not exist', async () => {
      mockPrisma.userFavoritePark.create.mockRejectedValue(new Error('Foreign key constraint failed'));

      await expect(parkService.addParkToUserFavorites(999, 999)).rejects.toThrow();
    });

    test('should throw error when duplicate favorite', async () => {
      mockPrisma.userFavoritePark.create.mockRejectedValue(new Error('Unique constraint failed'));

      await expect(parkService.addParkToUserFavorites(1, 1)).rejects.toThrow();
    });
  });

  describe('getUserFavoriteParks', () => {
    test('should return favorite parks for user', async () => {
      const favorites = [
        { userId: 1, parkId: 1, park: mockParkData },
        { userId: 1, parkId: 2, park: { ...mockParkData, id: 2, name: 'North Park' } },
      ];
      mockPrisma.userFavoritePark.findMany.mockResolvedValue(favorites);

      const result = await parkService.getUserFavoriteParks(1);

      expect(mockPrisma.userFavoritePark.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: { park: true },
      });
      expect(result).toEqual([favorites[0].park, favorites[1].park]);
    });

    test('should return empty array when user has no favorites', async () => {
      mockPrisma.userFavoritePark.findMany.mockResolvedValue([]);

      const result = await parkService.getUserFavoriteParks(1);

      expect(result).toEqual([]);
    });

    test('should throw error when query fails', async () => {
      mockPrisma.userFavoritePark.findMany.mockRejectedValue(new Error('Database error'));

      await expect(parkService.getUserFavoriteParks(1)).rejects.toThrow();
    });
  });

  describe('removeParkFromUserFavorites', () => {
    test('should remove park from user favorites successfully', async () => {
      mockPrisma.userFavoritePark.deleteMany.mockResolvedValue({ count: 1 });

      await parkService.removeParkFromUserFavorites(1, 1);

      expect(mockPrisma.userFavoritePark.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          parkId: 1,
        },
      });
    });

    test('should not throw error when favorite does not exist', async () => {
      mockPrisma.userFavoritePark.deleteMany.mockResolvedValue({ count: 0 });

      await expect(parkService.removeParkFromUserFavorites(1, 1)).resolves.not.toThrow();
    });

    test('should throw error when deletion fails', async () => {
      mockPrisma.userFavoritePark.deleteMany.mockRejectedValue(new Error('Deletion failed'));

      await expect(parkService.removeParkFromUserFavorites(1, 1)).rejects.toThrow();
    });
  });

  describe('Check-In Service', () => {
    const mockCheckInData = {
      id: 1,
      userId: 1,
      parkId: 1,
      dogId: 123,
      checkedInAt: new Date(),
      checkedOutAt: null,
    };
  
    beforeEach(() => {
      jest.clearAllMocks();
      // Ensure checkIn table is mocked
      mockPrisma.checkIn = {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      };
    });
  
    describe('checkIn', () => {
      // test one user/dog checked in
      test('should create a check-in when no active check-in exists', async () => {
        mockPrisma.checkIn.findFirst.mockResolvedValue(null);
        mockPrisma.checkIn.create.mockResolvedValue(mockCheckInData);
  
        const result = await parkService.checkIn(1, 1, 123);
  
        expect(mockPrisma.checkIn.findFirst).toHaveBeenCalledWith({
          where: { userId: 1, checkedOutAt: null },
        });
        expect(mockPrisma.checkIn.create).toHaveBeenCalledWith({
          data: { userId: 1, parkId: 1, dogId: 123 },
        });
        expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            id: 'test-event-id',
            type: 'park.checked_in',
            actorId: 1,
          }),
        });
        expect(result).toEqual(mockCheckInData);
      });
  
      // test for user attempting to check in when already checked in
      test('should throw error if user already has an active check-in', async () => {
        mockPrisma.checkIn.findFirst.mockResolvedValue(mockCheckInData);
  
        await expect(parkService.checkIn(1, 1, 123)).rejects.toThrow(
          'User already has an active check-in.'
        );
      });
  
      test('should throw error when creation fails', async () => {
        mockPrisma.checkIn.findFirst.mockResolvedValue(null);
        mockPrisma.checkIn.create.mockRejectedValue(new Error('DB error'));
  
        await expect(parkService.checkIn(1, 1, 123)).rejects.toThrow('Failed to check in');
      });
    });
  
    describe('checkOut', () => {
      test('should check out successfully if active check-in exists', async () => {
        mockPrisma.checkIn.findFirst.mockResolvedValue(mockCheckInData);
        const updatedCheckIn = { ...mockCheckInData, checkedOutAt: new Date() };
        mockPrisma.checkIn.update.mockResolvedValue(updatedCheckIn);
  
        const result = await parkService.checkOut(1, 1);
  
        expect(mockPrisma.checkIn.findFirst).toHaveBeenCalledWith({
          where: { userId: 1, parkId: 1, checkedOutAt: null },
        });
        expect(mockPrisma.checkIn.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { checkedOutAt: expect.any(Date) },
        });
        expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            id: 'test-event-id',
            type: 'park.checked_out',
            actorId: 1,
          }),
        });
        expect(result.checkedOutAt).not.toBeNull();
      });
  
      test('should throw error if no active check-in exists', async () => {
        mockPrisma.checkIn.findFirst.mockResolvedValue(null);
  
        await expect(parkService.checkOut(1, 1)).rejects.toThrow(
          'No active check-in found for this park'
        );
      });
  
      test('should throw error when update fails', async () => {
        mockPrisma.checkIn.findFirst.mockResolvedValue(mockCheckInData);
        mockPrisma.checkIn.update.mockRejectedValue(new Error('DB error'));
  
        await expect(parkService.checkOut(1, 1)).rejects.toThrow('Failed to check out');
      });
    });
  
    describe('getActiveCheckInsForPark', () => {
      test('should return active check-ins', async () => {
        const activeCheckIns = [mockCheckInData];
        mockPrisma.checkIn.findMany.mockResolvedValue(activeCheckIns);
  
        const result = await parkService.getActiveCheckInsForPark(1);
  
        expect(mockPrisma.checkIn.findMany).toHaveBeenCalledWith({
          where: { parkId: 1, checkedOutAt: null },
          include: { user: true, dog: true },
        });
        expect(result).toEqual(activeCheckIns);
      });
  
      test('should throw error when query fails', async () => {
        mockPrisma.checkIn.findMany.mockRejectedValue(new Error('DB error'));
  
        await expect(parkService.getActiveCheckInsForPark(1)).rejects.toThrow('Failed to fetch active check-ins');
      });
      // multiple users/dogs checked in
      test('should return multiple active check-ins with different dogs', async () => {
        const activeCheckIns = [
          {
            id: 1,
            userId: 1,
            parkId: 1,
            dogId: 101,
            checkedInAt: new Date(),
            checkedOutAt: null,
            user: { id: 1, username: 'alice' },
            dog: { id: 101, name: 'Rex' },
          },
          {
            id: 2,
            userId: 2,
            parkId: 1,
            dogId: 202,
            checkedInAt: new Date(),
            checkedOutAt: null,
            user: { id: 2, username: 'bob' },
            dog: { id: 202, name: 'Luna' },
          },
        ];
      
        mockPrisma.checkIn.findMany.mockResolvedValue(activeCheckIns);
      
        const result = await parkService.getActiveCheckInsForPark(1);
      
        expect(mockPrisma.checkIn.findMany).toHaveBeenCalledWith({
          where: {
            parkId: 1,
            checkedOutAt: null,
          },
          include: {
            user: true,
            dog: true,
          },
        });
      
        expect(result).toHaveLength(2);
        expect(result.map(ci => ci.dog.name)).toEqual(
          expect.arrayContaining(['Rex', 'Luna'])
        );
      });
    });
  
    describe('getStaleCheckIns', () => {
      test('should return check-ins before a certain date', async () => {
        const staleCheckIns = [mockCheckInData];
        const beforeDate = new Date();
        mockPrisma.checkIn.findMany.mockResolvedValue(staleCheckIns);
  
        const result = await parkService.getStaleCheckIns(beforeDate);
  
        expect(mockPrisma.checkIn.findMany).toHaveBeenCalledWith({
          where: {
            checkedOutAt: null,
            checkedInAt: { lt: beforeDate },
          },
        });
        expect(result).toEqual(staleCheckIns);
      });
    });
  
    describe('autoCheckOut', () => {
      test('should set checkedOutAt for a given check-in', async () => {
        const updatedCheckIn = { ...mockCheckInData, checkedOutAt: new Date() };
        mockPrisma.checkIn.update.mockResolvedValue(updatedCheckIn);
  
        const result = await parkService.autoCheckOut(1);
  
        expect(mockPrisma.checkIn.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { checkedOutAt: expect.any(Date) },
        });
        expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            id: 'test-event-id',
            type: 'park.auto_checked_out',
          }),
        });
        expect(result.checkedOutAt).not.toBeNull();
      });
    });
  });
});
