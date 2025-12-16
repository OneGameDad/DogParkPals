import { describe, test, expect, beforeEach, jest } from '@jest/globals';



// Mock Prisma before importing the service
// Define mockPrisma before jest.mock so it can be referenced
const mockPrisma: any = {
  dog: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  dogOwner: {
    create: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
};

const mockDogData = {
  id: 1,
  name: 'Rex',
  breed: 'LABRADOR_RETRIEVER',
  gender: 'MALE',
  dateOfBirth: new Date('2020-01-15'),
  fixed: false,
  size: 'LARGE',
  description: 'A friendly labrador',
  profilePictureUrl: 'https://example.com/rex.jpg',
  vaccinationRecordUrl: 'https://example.com/vax.pdf',
  playstyle: 'SOCIAL',
  currentLocationId: null,
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

jest.mock('../utils/validator', () => ({
  parseValidation: jest.fn((schema, data) => data),
}));

// Import AFTER all mocks are defined
import dogService from '../services/dogService';

describe('Dog Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addDog', () => {
    test('creates a new dog with valid data', async () => {
      const dogInput = {
        name: 'Rex',
          breed: 'LABRADOR_RETRIEVER',
          gender: 'MALE',
        dateOfBirth: new Date('2020-01-15'),
          playstyle: 'SOCIAL',
          size: 'LARGE',
        description: 'A friendly labrador',
        profilePictureUrl: 'https://example.com/rex.jpg',
        vaccinationRecordUrl: 'https://example.com/vax.pdf',
      };

      mockPrisma.dog.create.mockResolvedValue(mockDogData);

      const result = await dogService.addDog(dogInput);

      expect(mockPrisma.dog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Rex',
            breed: 'LABRADOR_RETRIEVER',
            gender: 'MALE',
            playstyle: 'SOCIAL',
            size: 'LARGE',
          }),
        })
      );
      expect(result.id).toBe(mockDogData.id);
      expect(result.name).toBe('Rex');
    });

    test('converts dateOfBirth string to Date', async () => {
      const dogInput = {
        name: 'Bella',
          breed: 'GOLDEN_RETRIEVER',
          gender: 'FEMALE',
        dateOfBirth: '2021-06-10T00:00:00Z',
          playstyle: 'ENERGETIC',
          size: 'MEDIUM',
      };

      const bellaData = {
        ...mockDogData,
        name: 'Bella',
        dateOfBirth: new Date('2021-06-10'),
      };
      mockPrisma.dog.create.mockResolvedValue(bellaData);

      const result = await dogService.addDog(dogInput);

      expect(mockPrisma.dog.create).toHaveBeenCalled();
      expect(result.name).toBe('Bella');
    });

    test('throws error when dog creation fails', async () => {
      const dogInput = {
        name: 'Rex',
          breed: 'LABRADOR_RETRIEVER',
          gender: 'MALE',
        dateOfBirth: new Date(),
          playstyle: 'SOCIAL',
          size: 'LARGE',
      };

      mockPrisma.dog.create.mockRejectedValue(new Error('Database error'));

      await expect(dogService.addDog(dogInput)).rejects.toThrow();
    });
  });

  describe('getDogById', () => {
    test('fetches dog by ID successfully', async () => {
      mockPrisma.dog.findUnique.mockResolvedValue(mockDogData);

      const result = await dogService.getDogById(1);

      expect(mockPrisma.dog.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockDogData);
    });

    test('returns null when dog not found', async () => {
      mockPrisma.dog.findUnique.mockResolvedValue(null);

      const result = await dogService.getDogById(999);

      expect(result).toBeNull();
    });

    test('throws error on database failure', async () => {
      mockPrisma.dog.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(dogService.getDogById(1)).rejects.toThrow();
    });
  });

  describe('getDogByOwner', () => {
    test('fetches dogs by owner ID', async () => {
      const dogsData = [mockDogData, { ...mockDogData, id: 2, name: 'Bella' }];
      mockPrisma.dog.findMany.mockResolvedValue(dogsData);

      const result = await dogService.getDogByOwner(1);

      expect(mockPrisma.dog.findMany).toHaveBeenCalledWith({
        where: {
          ownerRecords: {
            some: {
              userId: 1,
            },
          },
        },
      });
      expect(result).toEqual(dogsData);
      expect(result.length).toBe(2);
    });

    test('returns empty array when user has no dogs', async () => {
      mockPrisma.dog.findMany.mockResolvedValue([]);

      const result = await dogService.getDogByOwner(999);

      expect(result).toEqual([]);
    });

    test('throws error on database failure', async () => {
      mockPrisma.dog.findMany.mockRejectedValue(new Error('Database error'));

      await expect(dogService.getDogByOwner(1)).rejects.toThrow();
    });
  });

  describe('getAllDogs', () => {
    test('fetches all dogs successfully', async () => {
      const dogsData = [mockDogData, { ...mockDogData, id: 2, name: 'Bella' }];
      mockPrisma.dog.findMany.mockResolvedValue(dogsData);

      const result = await dogService.getAllDogs();

      expect(mockPrisma.dog.findMany).toHaveBeenCalledWith();
      expect(result).toEqual(dogsData);
      expect(result.length).toBe(2);
    });

    test('returns empty array when no dogs exist', async () => {
      mockPrisma.dog.findMany.mockResolvedValue([]);

      const result = await dogService.getAllDogs();

      expect(result).toEqual([]);
    });

    test('throws error on database failure', async () => {
      mockPrisma.dog.findMany.mockRejectedValue(new Error('Database error'));

      await expect(dogService.getAllDogs()).rejects.toThrow();
    });
  });

  describe('getAllDogsByPark', () => {
    test('fetches dogs currently at park', async () => {
      const parkDogs = [
        { ...mockDogData, id: 3, name: 'Scout', currentLocationId: 10 },
        { ...mockDogData, id: 4, name: 'Luna', currentLocationId: 10 },
      ];
      mockPrisma.dog.findMany.mockResolvedValue(parkDogs);

      const result = await dogService.getAllDogsByPark(10);

      expect(mockPrisma.dog.findMany).toHaveBeenCalledWith({
        where: { currentLocationId: 10 },
      });
      expect(result).toEqual(parkDogs);
    });

    test('returns empty array when no dogs at park', async () => {
      mockPrisma.dog.findMany.mockResolvedValue([]);

      const result = await dogService.getAllDogsByPark(99);

      expect(result).toEqual([]);
    });

    test('throws error on database failure', async () => {
      mockPrisma.dog.findMany.mockRejectedValue(new Error('Database error'));

      await expect(dogService.getAllDogsByPark(10)).rejects.toThrow();
    });
  });

  describe('updateDog', () => {
    test('updates dog with valid data', async () => {
      const updateData = {
        name: 'Rex Jr',
          playstyle: 'CALM',
      };

      const updatedDog = { ...mockDogData, name: 'Rex Jr', playstyle: 'CALM' };
      mockPrisma.dog.update.mockResolvedValue(updatedDog);

      const result = await dogService.updateDog(1, updateData);

      expect(mockPrisma.dog.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          name: 'Rex Jr',
          playstyle: 'CALM',
        }),
      });
      expect(result).toEqual(updatedDog);
    });

    test('only includes provided fields in update', async () => {
      const updateData = { name: 'Rex Jr' };
      mockPrisma.dog.update.mockResolvedValue({ ...mockDogData, name: 'Rex Jr' });

      await dogService.updateDog(1, updateData);

      const callArgs = mockPrisma.dog.update.mock.calls[0][0] as any;
      expect(callArgs.data).toHaveProperty('name');
      expect(Object.keys(callArgs.data).length).toBe(1);
    });

    test('casts enum strings to proper types', async () => {
      const updateData = {
        breed: 'GERMAN_SHEPHERD_DOG',
        size: 'GIANT',
        playstyle: 'AGGRESSIVE',
      };

      mockPrisma.dog.update.mockResolvedValue({ ...mockDogData, ...updateData });

      await dogService.updateDog(1, updateData);

      const callArgs = mockPrisma.dog.update.mock.calls[0][0] as any;
      expect(callArgs.data.breed).toBe('GERMAN_SHEPHERD_DOG');
      expect(callArgs.data.size).toBe('GIANT');
      expect(callArgs.data.playstyle).toBe('AGGRESSIVE');
    });

    test('throws error when dog not found', async () => {
      mockPrisma.dog.update.mockRejectedValue(new Error('Dog not found'));

      await expect(dogService.updateDog(999, { name: 'Updated' })).rejects.toThrow();
    });
  });

  describe('deleteDog', () => {
    test('deletes dog successfully', async () => {
      mockPrisma.dog.delete.mockResolvedValue(mockDogData);

      await dogService.deleteDog(1);

      expect(mockPrisma.dog.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    test('throws error when dog not found', async () => {
      mockPrisma.dog.delete.mockRejectedValue(new Error('Dog not found'));

      await expect(dogService.deleteDog(999)).rejects.toThrow();
    });
  });

  describe('addOwnerToDog', () => {
    test('adds owner to dog successfully', async () => {
      mockPrisma.dogOwner.create.mockResolvedValue({ userId: 1, dogId: 1 });

      await dogService.addOwnerToDog(1, 1);

      expect(mockPrisma.dogOwner.create).toHaveBeenCalledWith({
        data: {
          dogId: 1,
          userId: 1,
        },
      });
    });

    test('throws error when adding duplicate owner', async () => {
      mockPrisma.dogOwner.create.mockRejectedValue(new Error('Unique constraint failed'));

      await expect(dogService.addOwnerToDog(1, 1)).rejects.toThrow();
    });
  });

  describe('removeOwnerFromDog', () => {
    test('removes owner from dog successfully', async () => {
      mockPrisma.dogOwner.delete.mockResolvedValue({ userId: 1, dogId: 1 });

      await dogService.removeOwnerFromDog(1, 1);

      expect(mockPrisma.dogOwner.delete).toHaveBeenCalledWith({
        where: {
          userId_dogId: {
            dogId: 1,
            userId: 1,
          },
        },
      });
    });

    test('throws error when owner-dog relationship not found', async () => {
      mockPrisma.dogOwner.delete.mockRejectedValue(new Error('Record not found'));

      await expect(dogService.removeOwnerFromDog(999, 999)).rejects.toThrow();
    });
  });

  describe('getOwnersOfDog', () => {
    test('fetches all owners of a dog', async () => {
      const mockUsers = [
        { id: 1, username: 'john', email: 'john@example.com' },
        { id: 2, username: 'jane', email: 'jane@example.com' },
      ];
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await dogService.getOwnersOfDog(1);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          dogOwnerships: {
            some: {
              dogId: 1,
            },
          },
        },
      });
      expect(result).toEqual(mockUsers);
      expect(result.length).toBe(2);
    });

    test('returns empty array when dog has no owners', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await dogService.getOwnersOfDog(999);

      expect(result).toEqual([]);
    });

    test('throws error on database failure', async () => {
      mockPrisma.user.findMany.mockRejectedValue(new Error('Database error'));

      await expect(dogService.getOwnersOfDog(1)).rejects.toThrow();
    });
  });
});
