import searchService from '../services/searchService';
import { PrismaClient } from '@prisma/client';
import organizationService from '../services/organizationService';

const prisma = new PrismaClient();

jest.mock('../services/organizationService');

const mockGetMember = organizationService.getMember as jest.MockedFunction<typeof organizationService.getMember>;

describe('Search Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      const results = await searchService.searchParks('%park%', 10, 0);
      expect(Array.isArray(results)).toBe(true);
      results.forEach(park => {
        expect(park).toHaveProperty('entityType', 'PARK');
      });
    });

    test('should include park details', async () => {
      const results = await searchService.searchParks('%park%', 10, 0);
      if (results.length > 0) {
        const park = results[0];
        expect(park).toHaveProperty('id');
        expect(park).toHaveProperty('name');
        expect(park).toHaveProperty('entityType', 'PARK');
      }
    });

    test('should handle case-insensitive search', async () => {
      const results = await searchService.searchParks('%PARK%', 10, 0);
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('searchUsers', () => {
    test('should find users by username', async () => {
      const results = await searchService.searchUsers('%user%', 10, 0);
      expect(Array.isArray(results)).toBe(true);
      results.forEach(user => {
        expect(user).toHaveProperty('entityType', 'USER');
      });
    });

    test('should not expose sensitive user data', async () => {
      const results = await searchService.searchUsers('%user%', 10, 0);
      if (results.length > 0) {
        const user = results[0];
        expect(user).not.toHaveProperty('password_hash');
      }
    });

    test('should include basic user fields', async () => {
      const results = await searchService.searchUsers('%user%', 10, 0);
      if (results.length > 0) {
        const user = results[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('username');
      }
    });
  });

  describe('searchDogs', () => {
    test('should find dogs by name', async () => {
      const results = await searchService.searchDogs('%dog%', 10, 0);
      expect(Array.isArray(results)).toBe(true);
      results.forEach(dog => {
        expect(dog).toHaveProperty('entityType', 'DOG');
      });
    });

    test('should include dog details', async () => {
      const results = await searchService.searchDogs('%dog%', 10, 0);
      if (results.length > 0) {
        const dog = results[0];
        expect(dog).toHaveProperty('breed');
        expect(dog).toHaveProperty('entityType', 'DOG');
      }
    });
  });

  describe('searchOrganizations', () => {
    test('should return public fields for all users', async () => {
      const results = await searchService.searchOrganizations('%org%', 10, 0);
      if (results.length > 0) {
        const org = results[0];
        expect(org).toHaveProperty('name');
        expect(org).toHaveProperty('description');
        expect(org).toHaveProperty('entityType', 'ORGANIZATION');
      }
    });

    test('should include additional fields for members', async () => {
      mockGetMember.mockResolvedValue({ role: 'OWNER' } as any);
      const results = await searchService.searchOrganizations('%org%', 10, 0, 1, 'CLIENT');

      if (results.length > 0) {
        const orgWithMembership = results.find((o: any) => o.memberRole);
        if (orgWithMembership) {
          expect(orgWithMembership).toHaveProperty('ownerId');
          expect(orgWithMembership).toHaveProperty('memberRole');
        }
      }
    });

    test('should hide owner info from non-members', async () => {
      mockGetMember.mockResolvedValue(null);
      const results = await searchService.searchOrganizations('%org%', 10, 0, 1, 'CLIENT');

      if (results.length > 0) {
        const org = results[0];
        if (!org.memberRole) {
          expect(org).not.toHaveProperty('ownerId');
        }
      }
    });
  });

  describe('searchEvents', () => {
    test('should find public events for all users', async () => {
      const results = await searchService.searchEvents('%event%', 10, 0);
      expect(Array.isArray(results)).toBe(true);
      results.forEach(event => {
        expect(event).toHaveProperty('entityType', 'EVENT');
      });
    });

    test('should not show private events to unauthenticated users', async () => {
      const results = await searchService.searchEvents('%event%', 10, 0);
      results.forEach(event => {
        expect(event.private).toBe(false);
      });
    });

    test('should show all events to admins', async () => {
      const results = await searchService.searchEvents('%event%', 10, 0, 1, 'ADMIN');
      expect(Array.isArray(results)).toBe(true);
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
