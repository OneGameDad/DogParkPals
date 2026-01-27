import { PrismaClient } from '@prisma/client';
import typeSafeLogger from '../utils/typeSafeLogger';
import { toAppError } from '../utils/errors';
import organizationService from './organizationService';

const prisma = new PrismaClient();

export interface SearchFilters {
  type?: 'PARK' | 'USER' | 'DOG' | 'ORGANIZATION' | 'EVENT';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  parks: any[];
  users: any[];
  dogs: any[];
  organizations: any[];
  events: any[];
  total: number;
}

const searchService = {
  /**
   * Perform advanced search across all entity types
   * Applies authorization rules for private content
   */
  async search(
    query: string,
    filters: SearchFilters,
    userId?: number,
    userRole?: string
  ): Promise<SearchResult> {
    typeSafeLogger.info('Performing advanced search', { query, userId });

    if (!query || query.trim().length === 0) {
      return {
        parks: [],
        users: [],
        dogs: [],
        organizations: [],
        events: [],
        total: 0,
      };
    }

    try {
      const limit = Math.min(filters.limit || 10, 50); // Max 50 per type
      const offset = filters.offset || 0;
      const searchTerm = `%${query}%`;

      const results = await Promise.all([
        filters.type === undefined || filters.type === 'PARK'
          ? searchService.searchParks(searchTerm, limit, offset)
          : Promise.resolve([]),
        filters.type === undefined || filters.type === 'USER'
          ? searchService.searchUsers(searchTerm, limit, offset)
          : Promise.resolve([]),
        filters.type === undefined || filters.type === 'DOG'
          ? searchService.searchDogs(searchTerm, limit, offset)
          : Promise.resolve([]),
        filters.type === undefined || filters.type === 'ORGANIZATION'
          ? searchService.searchOrganizations(searchTerm, limit, offset, userId, userRole)
          : Promise.resolve([]),
        filters.type === undefined || filters.type === 'EVENT'
          ? searchService.searchEvents(searchTerm, limit, offset, userId, userRole)
          : Promise.resolve([]),
      ]);

      const [parks, users, dogs, organizations, events] = results;

      const total = parks.length + users.length + dogs.length + organizations.length + events.length;

      typeSafeLogger.logUserAction('Search completed', {
        query,
        results: { parks: parks.length, users: users.length, dogs: dogs.length, organizations: organizations.length, events: events.length },
      });

      return {
        parks,
        users,
        dogs,
        organizations,
        events,
        total,
      };
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to perform search',
        code: 'SEARCH_FAILED',
      });
      typeSafeLogger.logError('Search failed', appError, { query });
      throw appError;
    }
  },

  /**
   * Search parks by name and description
   * Parks are public, no authorization needed
   */
  async searchParks(searchTerm: string, limit: number, offset: number) {
    typeSafeLogger.info('Searching parks', { limit, offset });
    try {
      const parks = await prisma.park.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm } },
            { description: { contains: searchTerm } },
          ],
        },
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
          description: true,
          amenities: true,
          profilePictureUrl: true,
        },
        take: limit,
        skip: offset,
      });

      return parks.map(park => ({
        ...park,
        entityType: 'PARK',
      }));
    } catch (error) {
      typeSafeLogger.logError('Park search failed', error);
      return [];
    }
  },

  /**
   * Search users by username, email, or name
   * Basic user info is public, detailed info requires authentication
   */
  async searchUsers(searchTerm: string, limit: number, offset: number) {
    typeSafeLogger.info('Searching users', { limit, offset });
    try {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: searchTerm } },
            { email: { contains: searchTerm } },
            { first_name: { contains: searchTerm } },
            { last_name: { contains: searchTerm } },
          ],
        },
        select: {
          id: true,
          username: true,
          first_name: true,
          last_name: true,
          profilePictureUrl: true,
        },
        take: limit,
        skip: offset,
      });

      return users.map(user => ({
        ...user,
        entityType: 'USER',
      }));
    } catch (error) {
      typeSafeLogger.logError('User search failed', error);
      return [];
    }
  },

  /**
   * Search dogs by name and breed
   * Dogs are public, no authorization needed
   */
  async searchDogs(searchTerm: string, limit: number, offset: number) {
    typeSafeLogger.info('Searching dogs', { limit, offset });
    try {
      const dogs = await prisma.dog.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm } },
          ],
        },
        select: {
          id: true,
          name: true,
          breed: true,
          gender: true,
          size: true,
          playstyle: true,
          profilePictureUrl: true,
        },
        take: limit,
        skip: offset,
      });

      return dogs.map(dog => ({
        ...dog,
        entityType: 'DOG',
      }));
    } catch (error) {
      typeSafeLogger.logError('Dog search failed', error);
      return [];
    }
  },

  /**
   * Search organizations by name and description
   * Applies visibility rules based on user membership and role
   */
  async searchOrganizations(
    searchTerm: string,
    limit: number,
    offset: number,
    userId?: number,
    userRole?: string
  ) {
    typeSafeLogger.info('Searching organizations', { limit, offset, userId });
    try {
      const organizations = await prisma.organization.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm } },
            { description: { contains: searchTerm } },
          ],
        },
        select: {
          id: true,
          name: true,
          description: true,
          profilePictureUrl: true,
          websiteUrl: true,
          ownerId: true,
        },
        take: limit,
        skip: offset,
      });

      // Filter and sanitize based on user authorization
      const filteredOrgs = await Promise.all(
        organizations.map(async (org) => {
          const memberRole = userId ? await organizationService.getMember(org.id, userId) : undefined;
          const isMember = memberRole !== undefined && memberRole !== null;
          const isAdmin = userRole === 'ADMIN' || userRole === 'DEVELOPER';

          // All users can see public fields
          const result: any = {
            id: org.id,
            name: org.name,
            profilePictureUrl: org.profilePictureUrl,
            websiteUrl: org.websiteUrl,
            description: org.description,
            entityType: 'ORGANIZATION',
          };

          // Only members and admins see owner info
          if (isMember || isAdmin) {
            result.ownerId = org.ownerId;
            if (memberRole) {
              result.memberRole = memberRole.role;
            }
          }

          return result;
        })
      );

      return filteredOrgs;
    } catch (error) {
      typeSafeLogger.logError('Organization search failed', error);
      return [];
    }
  },

  /**
   * Search events by title and description
   * Applies visibility rules: public events visible to all,
   * private events only visible to org members and admins
   */
  async searchEvents(
    searchTerm: string,
    limit: number,
    offset: number,
    userId?: number,
    userRole?: string
  ) {
    typeSafeLogger.info('Searching events', { limit, offset, userId });
    try {
      const isAdmin = userRole === 'ADMIN' || userRole === 'DEVELOPER';

      // For SQLite, we need to handle the query differently
      // First fetch events matching the search term
      let events = await prisma.event.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm } },
            { description: { contains: searchTerm } },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          date: true,
          startTime: true,
          endTime: true,
          private: true,
          parkId: true,
          organizerId: true,
          organizationId: true,
          park: {
            select: {
              id: true,
              name: true,
            },
          },
          organizer: {
            select: {
              id: true,
              username: true,
              profilePictureUrl: true,
            },
          },
        },
        take: limit,
        skip: offset,
      });

      // Filter based on visibility rules
      if (!isAdmin) {
        events = events.filter(event => {
          // Show public events to everyone
          if (event.private === 'PUBLIC') {
            return true;
          }

          // Private events: only show to organizer
          if (event.organizerId === userId) {
            return true;
          }

          return false;
        });
      }

      return events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        private: event.private,
        parkId: event.parkId,
        organizerId: event.organizerId,
        organizationId: event.organizationId,
        park: event.park,
        organizer: event.organizer,
        entityType: 'EVENT',
      }));
    } catch (error) {
      typeSafeLogger.logError('Event search failed', error);
      return [];
    }
  },

  /**
   * Search a specific entity type with pagination
   */
  async searchByType(
    query: string,
    type: 'PARK' | 'USER' | 'DOG' | 'ORGANIZATION' | 'EVENT',
    limit: number = 10,
    offset: number = 0,
    userId?: number,
    userRole?: string
  ) {
    typeSafeLogger.info('Searching by type', { query, type, limit, offset });

    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = `%${query}%`;

    try {
      switch (type) {
        case 'PARK':
          return await searchService.searchParks(searchTerm, limit, offset);
        case 'USER':
          return await searchService.searchUsers(searchTerm, limit, offset);
        case 'DOG':
          return await searchService.searchDogs(searchTerm, limit, offset);
        case 'ORGANIZATION':
          return await searchService.searchOrganizations(searchTerm, limit, offset, userId, userRole);
        case 'EVENT':
          return await searchService.searchEvents(searchTerm, limit, offset, userId, userRole);
        default:
          return [];
      }
    } catch (error) {
      const appError = toAppError(error, {
        message: `Failed to search ${type.toLowerCase()}`,
        code: 'SEARCH_FAILED',
      });
      typeSafeLogger.logError(`Search by type failed: ${type}`, appError);
      throw appError;
    }
  },
};

export default searchService;
