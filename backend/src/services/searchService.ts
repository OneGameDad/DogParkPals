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

export interface ParkSearchResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  description: string | null;
  amenities: string[];
  profilePictureUrl: string | null;
  entityType: 'PARK';
}

export interface UserSearchResult {
  id: number;
  username: string;
  first_name: string | null;
  last_name: string | null;
  profilePictureUrl: string | null;
  entityType: 'USER';
}

export interface DogSearchResult {
  id: number;
  name: string;
  breed: string;
  gender: string;
  size: string | null;
  playstyle: string | null;
  profilePictureUrl: string | null;
  entityType: 'DOG';
}

export interface OrganizationSearchResult {
  id: number;
  name: string;
  profilePictureUrl: string | null;
  websiteUrl: string | null;
  description: string | null;
  entityType: 'ORGANIZATION';
  ownerId?: number;
  memberRole?: string;
}

export interface EventSearchResult {
  id: number;
  title: string;
  description: string | null;
  date: Date;
  startTime: Date | null;
  endTime: Date | null;
  private: string;
  parkId: number;
  organizerId: number;
  organizationId: number | null;
  park: {
    id: number;
    name: string;
  };
  organizer: {
    id: number;
    username: string;
    profilePictureUrl: string | null;
  };
  entityType: 'EVENT';
}

export interface SearchResult {
  parks: ParkSearchResult[];
  users: UserSearchResult[];
  dogs: DogSearchResult[];
  organizations: OrganizationSearchResult[];
  events: EventSearchResult[];
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
      const searchTerm = query; // Prisma's contains operator handles wildcards

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
  async searchParks(searchTerm: string, limit: number, offset: number): Promise<ParkSearchResult[]> {
    typeSafeLogger.info('Searching parks', { limit, offset });
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
      amenities: park.amenities as string[],
      entityType: 'PARK' as const,
    }));
  },

  /**
   * Search users by username or name
   * Email is excluded from search for privacy reasons
   * Basic user info is public, detailed info requires authentication
   */
  async searchUsers(searchTerm: string, limit: number, offset: number): Promise<UserSearchResult[]> {
    typeSafeLogger.info('Searching users', { limit, offset });
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: searchTerm } },
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
      entityType: 'USER' as const,
    }));
  },

  /**
   * Search dogs by name
   * Breed is an enum so it's not searchable via contains;
   * if breed filtering is needed, it should be a separate filter parameter
   * Dogs are public, no authorization needed
   */
  async searchDogs(searchTerm: string, limit: number, offset: number): Promise<DogSearchResult[]> {
    typeSafeLogger.info('Searching dogs', { limit, offset });
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
      id: dog.id,
      name: dog.name,
      breed: dog.breed as string,
      gender: dog.gender,
      size: dog.size as string | null,
      playstyle: dog.playstyle as string | null,
      profilePictureUrl: dog.profilePictureUrl,
      entityType: 'DOG' as const,
    }));
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
  ): Promise<OrganizationSearchResult[]> {
    typeSafeLogger.info('Searching organizations', { limit, offset, userId });
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

      // Fetch all user memberships in one query to avoid N+1 problem
      const userMemberships = userId
        ? await prisma.organizationMember.findMany({
            where: {
              userId,
              organizationId: { in: organizations.map(org => org.id) },
            },
            select: {
              organizationId: true,
              role: true,
            },
          })
        : [];

      // Create a map for O(1) lookup
      const membershipMap = new Map(
        userMemberships.map(m => [m.organizationId, m.role])
      );

      const isAdmin = userRole === 'ADMIN' || userRole === 'DEVELOPER';

      // Filter and sanitize based on user authorization
      const filteredOrgs = organizations.map((org) => {
        const memberRole = membershipMap.get(org.id);
        const isMember = memberRole !== undefined;

        // All users can see public fields
        const result: OrganizationSearchResult = {
          id: org.id,
          name: org.name,
          profilePictureUrl: org.profilePictureUrl,
          websiteUrl: org.websiteUrl,
          description: org.description,
          entityType: 'ORGANIZATION' as const,
        };

        // Only members and admins see owner info
        if (isMember || isAdmin) {
          result.ownerId = org.ownerId;
          if (memberRole) {
            result.memberRole = memberRole;
          }
        }

        return result;
      });

      return filteredOrgs;
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
  ): Promise<EventSearchResult[]> {
    typeSafeLogger.info('Searching events', { limit, offset, userId });
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
        // Fetch all user memberships for event organizations in one query to avoid N+1 problem
        const eventOrgIds = events
          .filter(e => e.organizationId !== null)
          .map(e => e.organizationId as number);

        const userMemberships = userId && eventOrgIds.length > 0
          ? await prisma.organizationMember.findMany({
              where: {
                userId,
                organizationId: { in: eventOrgIds },
              },
              select: {
                organizationId: true,
              },
            })
          : [];

        // Create a Set for O(1) lookup
        const memberOrgIds = new Set(userMemberships.map(m => m.organizationId));

        // Filter events based on visibility rules
        events = events.filter((event) => {
          // Show public events to everyone
          if (event.private === 'PUBLIC') {
            return true;
          }

          // Private events: show to organizer
          if (event.organizerId === userId) {
            return true;
          }

          // Private events: show to organization members
          if (event.organizationId && memberOrgIds.has(event.organizationId)) {
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
        private: event.private as string,
        parkId: event.parkId,
        organizerId: event.organizerId,
        organizationId: event.organizationId,
        park: event.park,
        organizer: event.organizer,
        entityType: 'EVENT' as const,
      }));
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

    const searchTerm = query; // Prisma's contains operator handles wildcards

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
