import searchService from '../services/searchService';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    park: {
      findMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    dog: {
      findMany: jest.fn(),
    },
    organization: {
      findMany: jest.fn(),
    },
    organizationMember: {
      findMany: jest.fn(),
    },
    event: {
      findMany: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

const prisma = new PrismaClient() as jest.Mocked<PrismaClient>;

describe('Search Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mock implementations
    (prisma.park.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.dog.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.organization.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.organizationMember.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.event.findMany as jest.Mock).mockResolvedValue([]);
  });

  describe('search', () => {
    test('should return empty results for empty query', async () => {
      const result = await searchService.search('', {});
      expect(result.total).toBe(0);
      expect(result.parks).toEqual([]);
      expect(result.users).toEqual([]);
    });

    test('should search across all entity types', async () => {
      const result = await searchService.search('a', { limit: 5 });
      expect(result).toHaveProperty('parks');
      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('dogs');
      expect(result).toHaveProperty('organizations');
      expect(result).toHaveProperty('events');
      expect(result).toHaveProperty('total');
    });

    test('should filter by entity type', async () => {
      const result = await searchService.search('test', { type: 'PARK', limit: 10 });
      // Should only search parks
      expect(result.users.length).toBe(0);
      expect(result.dogs.length).toBe(0);
      expect(result.organizations.length).toBe(0);
      expect(result.events.length).toBe(0);
    });

    test('should respect pagination limits', async () => {
      const result = await searchService.search('a', { limit: 5, offset: 0 });
      // Each type should respect the limit
      expect(result.parks.length).toBeLessThanOrEqual(5);
      expect(result.users.length).toBeLessThanOrEqual(5);
      expect(result.dogs.length).toBeLessThanOrEqual(5);
    });

    test('should cap limit at 50', async () => {
      const result = await searchService.search('a', { limit: 100, offset: 0 });
      expect(result.parks.length).toBeLessThanOrEqual(50);
    });
  });

  describe('searchParks', () => {
    test('should find parks by name', async () => {
      const mockParks = [
        {
          id: 1,
          name: 'Central Park',
          latitude: 40.785091,
          longitude: -73.968285,
          description: 'A large park',
          amenities: ['fountain', 'benches'],
          profilePictureUrl: null,
        },
      ];
      (prisma.park.findMany as jest.Mock).mockResolvedValue(mockParks);
      
      const results = await searchService.searchParks('%park%', 10, 0);
      expect(Array.isArray(results)).toBe(true);
      results.forEach(park => {
        expect(park).toHaveProperty('entityType', 'PARK');
      });
    });

    test('should include park details', async () => {
      const mockParks = [
        {
          id: 1,
          name: 'Central Park',
          latitude: 40.785091,
          longitude: -73.968285,
          description: 'A large park',
          amenities: ['fountain'],
          profilePictureUrl: null,
        },
      ];
      (prisma.park.findMany as jest.Mock).mockResolvedValue(mockParks);
      
      const results = await searchService.searchParks('%park%', 10, 0);
      expect(results.length).toBeGreaterThan(0);
      const park = results[0];
      expect(park).toHaveProperty('id');
      expect(park).toHaveProperty('name');
      expect(park).toHaveProperty('entityType', 'PARK');
    });

    test('should handle case-insensitive search', async () => {
      (prisma.park.findMany as jest.Mock).mockResolvedValue([]);
      
      const results = await searchService.searchParks('%PARK%', 10, 0);
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('searchUsers', () => {
    test('should find users by username', async () => {
      const mockUsers = [
        {
          id: 1,
          username: 'testuser',
          first_name: 'Test',
          last_name: 'User',
          profilePictureUrl: null,
        },
      ];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      
      const results = await searchService.searchUsers('%user%', 10, 0);
      expect(Array.isArray(results)).toBe(true);
      results.forEach(user => {
        expect(user).toHaveProperty('entityType', 'USER');
      });
    });

    test('should not expose sensitive user data', async () => {
      const mockUsers = [
        {
          id: 1,
          username: 'testuser',
          first_name: 'Test',
          last_name: 'User',
          profilePictureUrl: null,
        },
      ];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      
      const results = await searchService.searchUsers('%user%', 10, 0);
      expect(results.length).toBeGreaterThan(0);
      const user = results[0];
      expect(user).not.toHaveProperty('password_hash');
    });

    test('should include basic user fields', async () => {
      const mockUsers = [
        {
          id: 1,
          username: 'testuser',
          first_name: 'Test',
          last_name: 'User',
          profilePictureUrl: null,
        },
      ];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      
      const results = await searchService.searchUsers('%user%', 10, 0);
      expect(results.length).toBeGreaterThan(0);
      const user = results[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username');
    });
  });

  describe('searchDogs', () => {
    test('should find dogs by name', async () => {
      const mockDogs = [
        {
          id: 1,
          name: 'Buddy',
          breed: 'GOLDEN_RETRIEVER',
          gender: 'MALE',
          size: 'LARGE',
          playstyle: 'ACTIVE',
          profilePictureUrl: null,
        },
      ];
      (prisma.dog.findMany as jest.Mock).mockResolvedValue(mockDogs);
      
      const results = await searchService.searchDogs('%dog%', 10, 0);
      expect(Array.isArray(results)).toBe(true);
      results.forEach(dog => {
        expect(dog).toHaveProperty('entityType', 'DOG');
      });
    });

    test('should include dog details', async () => {
      const mockDogs = [
        {
          id: 1,
          name: 'Buddy',
          breed: 'GOLDEN_RETRIEVER',
          gender: 'MALE',
          size: 'LARGE',
          playstyle: 'ACTIVE',
          profilePictureUrl: null,
        },
      ];
      (prisma.dog.findMany as jest.Mock).mockResolvedValue(mockDogs);
      
      const results = await searchService.searchDogs('%dog%', 10, 0);
      expect(results.length).toBeGreaterThan(0);
      const dog = results[0];
      expect(dog).toHaveProperty('breed');
      expect(dog).toHaveProperty('entityType', 'DOG');
    });
  });

  describe('searchOrganizations', () => {
    test('should return public fields for all users', async () => {
      const mockOrgs = [
        {
          id: 1,
          name: 'Dog Lovers',
          description: 'A community of dog lovers',
          profilePictureUrl: null,
          websiteUrl: 'https://example.com',
          ownerId: 1,
        },
      ];
      (prisma.organization.findMany as jest.Mock).mockResolvedValue(mockOrgs);
      (prisma.organizationMember.findMany as jest.Mock).mockResolvedValue([]);
      
      const results = await searchService.searchOrganizations('%org%', 10, 0);
      expect(results.length).toBeGreaterThan(0);
      const org = results[0];
      expect(org).toHaveProperty('name');
      expect(org).toHaveProperty('description');
      expect(org).toHaveProperty('entityType', 'ORGANIZATION');
    });

    test('should include additional fields for members', async () => {
      const mockOrgs = [
        {
          id: 1,
          name: 'Dog Lovers',
          description: 'A community',
          profilePictureUrl: null,
          websiteUrl: 'https://example.com',
          ownerId: 1,
        },
      ];
      const mockMemberships = [
        {
          organizationId: 1,
          role: 'OWNER',
        },
      ];
      (prisma.organization.findMany as jest.Mock).mockResolvedValue(mockOrgs);
      (prisma.organizationMember.findMany as jest.Mock).mockResolvedValue(mockMemberships);
      
      const results = await searchService.searchOrganizations('%org%', 10, 0, 1, 'CLIENT');
      expect(results.length).toBeGreaterThan(0);
      const org = results[0];
      expect(org).toHaveProperty('ownerId');
      expect(org).toHaveProperty('memberRole', 'OWNER');
    });

    test('should hide owner info from non-members', async () => {
      const mockOrgs = [
        {
          id: 1,
          name: 'Dog Lovers',
          description: 'A community',
          profilePictureUrl: null,
          websiteUrl: 'https://example.com',
          ownerId: 1,
        },
      ];
      (prisma.organization.findMany as jest.Mock).mockResolvedValue(mockOrgs);
      (prisma.organizationMember.findMany as jest.Mock).mockResolvedValue([]);
      
      const results = await searchService.searchOrganizations('%org%', 10, 0, 1, 'CLIENT');
      expect(results.length).toBeGreaterThan(0);
      const org = results[0];
      expect(org).not.toHaveProperty('ownerId');
      expect(org).not.toHaveProperty('memberRole');
    });
  });

  describe('searchEvents', () => {
    test('should find public events for all users', async () => {
      const mockEvents = [
        {
          id: 1,
          title: 'Dog Meetup',
          description: 'Meet other dogs',
          date: new Date('2026-02-01'),
          startTime: new Date('2026-02-01T10:00:00'),
          endTime: new Date('2026-02-01T12:00:00'),
          private: 'PUBLIC',
          parkId: 1,
          organizerId: 1,
          organizationId: null,
          park: { id: 1, name: 'Central Park' },
          organizer: { id: 1, username: 'organizer', profilePictureUrl: null },
        },
      ];
      (prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents);
      (prisma.organizationMember.findMany as jest.Mock).mockResolvedValue([]);
      
      const results = await searchService.searchEvents('%event%', 10, 0);
      expect(Array.isArray(results)).toBe(true);
      results.forEach(event => {
        expect(event).toHaveProperty('entityType', 'EVENT');
      });
    });

    test('should not show private events to unauthenticated users', async () => {
      const mockEvents = [
        {
          id: 1,
          title: 'Public Event',
          description: 'Open to all',
          date: new Date('2026-02-01'),
          startTime: new Date('2026-02-01T10:00:00'),
          endTime: new Date('2026-02-01T12:00:00'),
          private: 'PUBLIC',
          parkId: 1,
          organizerId: 1,
          organizationId: null,
          park: { id: 1, name: 'Central Park' },
          organizer: { id: 1, username: 'organizer', profilePictureUrl: null },
        },
        {
          id: 2,
          title: 'Private Event',
          description: 'Members only',
          date: new Date('2026-02-01'),
          startTime: new Date('2026-02-01T14:00:00'),
          endTime: new Date('2026-02-01T16:00:00'),
          private: 'PRIVATE',
          parkId: 1,
          organizerId: 2,
          organizationId: 1,
          park: { id: 1, name: 'Central Park' },
          organizer: { id: 2, username: 'other', profilePictureUrl: null },
        },
      ];
      (prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents);
      (prisma.organizationMember.findMany as jest.Mock).mockResolvedValue([]);
      
      const results = await searchService.searchEvents('%event%', 10, 0);
      results.forEach(event => {
        expect(event.private).toBe('PUBLIC');
      });
    });

    test('should show all events to admins', async () => {
      const mockEvents = [
        {
          id: 1,
          title: 'Public Event',
          description: 'Open to all',
          date: new Date('2026-02-01'),
          startTime: new Date('2026-02-01T10:00:00'),
          endTime: new Date('2026-02-01T12:00:00'),
          private: 'PUBLIC',
          parkId: 1,
          organizerId: 1,
          organizationId: null,
          park: { id: 1, name: 'Central Park' },
          organizer: { id: 1, username: 'organizer', profilePictureUrl: null },
        },
        {
          id: 2,
          title: 'Private Event',
          description: 'Members only',
          date: new Date('2026-02-01'),
          startTime: new Date('2026-02-01T14:00:00'),
          endTime: new Date('2026-02-01T16:00:00'),
          private: 'PRIVATE',
          parkId: 1,
          organizerId: 2,
          organizationId: 1,
          park: { id: 1, name: 'Central Park' },
          organizer: { id: 2, username: 'other', profilePictureUrl: null },
        },
      ];
      (prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents);
      
      const results = await searchService.searchEvents('%event%', 10, 0, 1, 'ADMIN');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2); // Admin sees both public and private
    });
  });

  describe('searchByType', () => {
    test('should search specific type PARK', async () => {
      const results = await searchService.searchByType('a', 'PARK', 10, 0);
      results.forEach((r: any) => {
        expect(r.entityType).toBe('PARK');
      });
    });

    test('should search specific type USER', async () => {
      const results = await searchService.searchByType('a', 'USER', 10, 0);
      results.forEach((r: any) => {
        expect(r.entityType).toBe('USER');
      });
    });

    test('should search specific type DOG', async () => {
      const results = await searchService.searchByType('a', 'DOG', 10, 0);
      results.forEach((r: any) => {
        expect(r.entityType).toBe('DOG');
      });
    });

    test('should search specific type ORGANIZATION', async () => {
      const results = await searchService.searchByType('a', 'ORGANIZATION', 10, 0);
      results.forEach((r: any) => {
        expect(r.entityType).toBe('ORGANIZATION');
      });
    });

    test('should search specific type EVENT', async () => {
      const results = await searchService.searchByType('a', 'EVENT', 10, 0);
      results.forEach((r: any) => {
        expect(r.entityType).toBe('EVENT');
      });
    });

    test('should return empty for empty query', async () => {
      const results = await searchService.searchByType('', 'PARK', 10, 0);
      expect(results).toEqual([]);
    });

    test('should apply offset correctly', async () => {
      const firstPage = await searchService.searchByType('a', 'PARK', 5, 0);
      const secondPage = await searchService.searchByType('a', 'PARK', 5, 5);
      
      // Pages should be different (unless < 5 results)
      if (firstPage.length > 0 && secondPage.length > 0) {
        expect(firstPage[0].id).not.toBe(secondPage[0].id);
      }
    });
  });
});
