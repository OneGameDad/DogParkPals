import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock Prisma before importing the service
const mockPrisma: any = {
  organization: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  organizationMember: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  event: {
    findMany: jest.fn(),
  },
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

jest.mock('../utils/validationSchemas', () => ({
  createOrganizationSchema: {
    parse: jest.fn((data) => data),
  },
  updateOrganizationSchema: {
    parse: jest.fn((data) => data),
  },
  getOrganizationByIdSchema: {
    parse: jest.fn((data) => data),
  },
  getOrganizationByNameSchema: {
    parse: jest.fn((data) => data),
  },
  addMemberSchema: {
    parse: jest.fn((data) => data),
  },
  removeMemberSchema: {
    parse: jest.fn((data) => data),
  },
  updateMemberRoleSchema: {
    parse: jest.fn((data) => data),
  },
  getMemberSchema: {
    parse: jest.fn((data) => data),
  },
  getMembersSchema: {
    parse: jest.fn((data) => data),
  },
  isMemberSchema: {
    parse: jest.fn((data) => data),
  },
}));

// Import AFTER all mocks are defined
import organizationService from '../services/organizationService';

const mockOrgData = {
  id: 1,
  name: 'Dog Lovers Club',
  description: 'A club for dog lovers',
  profilePictureUrl: 'https://example.com/org.jpg',
  websiteUrl: 'https://dogloversclub.com',
  ownerId: 1,
  memberRole: 'OWNER',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockMemberData = {
  userId: 2,
  organizationId: 1,
  role: 'MEMBER',
  joinedAt: new Date(),
};

describe('Organization Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrganizationById', () => {
    test('should return organization when found', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrgData);

      const result = await organizationService.getOrganizationById(1);

      expect(result).toEqual(mockOrgData);
      expect(mockPrisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    test('should return null when organization not found', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);

      const result = await organizationService.getOrganizationById(999);

      expect(result).toBeNull();
    });

    test('should throw error when database operation fails', async () => {
      mockPrisma.organization.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(organizationService.getOrganizationById(1)).rejects.toThrow();
    });
  });

  describe('getOrganizationByName', () => {
    test('should return organization when found by name', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue(mockOrgData);

      const result = await organizationService.getOrganizationByName('Dog Lovers Club');

      expect(result).toEqual(mockOrgData);
      expect(mockPrisma.organization.findFirst).toHaveBeenCalledWith({
        where: { name: 'Dog Lovers Club' },
      });
    });

    test('should return null when organization not found by name', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue(null);

      const result = await organizationService.getOrganizationByName('Nonexistent Org');

      expect(result).toBeNull();
    });

    test('should throw error when database operation fails', async () => {
      mockPrisma.organization.findFirst.mockRejectedValue(new Error('Database error'));

      await expect(organizationService.getOrganizationByName('Dog Lovers Club')).rejects.toThrow();
    });
  });

  describe('getOrganizations', () => {
    test('should return all organizations', async () => {
      const allOrgs = [mockOrgData, { ...mockOrgData, id: 2, name: 'Cat Lovers Club' }];
      mockPrisma.organization.findMany.mockResolvedValue(allOrgs);

      const result = await organizationService.getOrganizations();

      expect(result).toEqual(allOrgs);
      expect(result.length).toBe(2);
      expect(mockPrisma.organization.findMany).toHaveBeenCalled();
    });

    test('should return empty array when no organizations exist', async () => {
      mockPrisma.organization.findMany.mockResolvedValue([]);

      const result = await organizationService.getOrganizations();

      expect(result).toEqual([]);
    });

    test('should throw error when database operation fails', async () => {
      mockPrisma.organization.findMany.mockRejectedValue(new Error('Database error'));

      await expect(organizationService.getOrganizations()).rejects.toThrow();
    });
  });

  describe('createOrganization', () => {
    test('should create organization successfully', async () => {
      mockPrisma.organization.create.mockResolvedValue(mockOrgData);

      const result = await organizationService.createOrganization(
        'Dog Lovers Club',
        'A club for dog lovers',
        'https://dogloversclub.com'
      );

      expect(result).toEqual(mockOrgData);
      expect(mockPrisma.organization.create).toHaveBeenCalledWith({
        data: {
          name: 'Dog Lovers Club',
          description: 'A club for dog lovers',
          websiteUrl: 'https://dogloversclub.com',
          ownerId: 1,
        },
      });
    });

    test('should create organization without optional fields', async () => {
      mockPrisma.organization.create.mockResolvedValue({ ...mockOrgData, description: undefined, websiteUrl: undefined });

      const result = await organizationService.createOrganization('Dog Lovers Club');

      expect(result).toBeDefined();
      expect(mockPrisma.organization.create).toHaveBeenCalled();
    });

    test('should throw error when validation fails', async () => {
      mockPrisma.organization.create.mockRejectedValue(new Error('Validation error'));

      await expect(organizationService.createOrganization('')).rejects.toThrow();
    });

    test('should throw error when database operation fails', async () => {
      mockPrisma.organization.create.mockRejectedValue(new Error('Database error'));

      await expect(organizationService.createOrganization('Dog Lovers Club')).rejects.toThrow();
    });
  });

  describe('updateOrganization', () => {
    test('should update organization successfully', async () => {
      const updatedOrg = { ...mockOrgData, name: 'Updated Club' };
      mockPrisma.organization.update.mockResolvedValue(updatedOrg);

      const result = await organizationService.updateOrganization(1, { name: 'Updated Club' });

      expect(result).toEqual(updatedOrg);
      expect(mockPrisma.organization.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Updated Club' },
      });
    });

    test('should update only provided fields', async () => {
      const partialUpdate = { description: 'Updated description' };
      mockPrisma.organization.update.mockResolvedValue({ ...mockOrgData, ...partialUpdate });

      await organizationService.updateOrganization(1, partialUpdate);

      expect(mockPrisma.organization.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: partialUpdate,
      });
    });

    test('should throw error when organization not found', async () => {
      mockPrisma.organization.update.mockRejectedValue(new Error('Not found'));

      await expect(organizationService.updateOrganization(999, { name: 'New Name' })).rejects.toThrow();
    });
  });

  describe('deleteOrganization', () => {
    test('should delete organization successfully', async () => {
      mockPrisma.organization.delete.mockResolvedValue(mockOrgData);

      await organizationService.deleteOrganization(1);

      expect(mockPrisma.organization.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    test('should throw error when organization not found', async () => {
      mockPrisma.organization.delete.mockRejectedValue(new Error('Not found'));

      await expect(organizationService.deleteOrganization(999)).rejects.toThrow();
    });

    test('should throw error when database operation fails', async () => {
      mockPrisma.organization.delete.mockRejectedValue(new Error('Database error'));

      await expect(organizationService.deleteOrganization(1)).rejects.toThrow();
    });
  });

  describe('addMember', () => {
    test('should add member with default MEMBER role', async () => {
      mockPrisma.organizationMember.create.mockResolvedValue(mockMemberData);

      const result = await organizationService.addMember(1, 2);

      expect(result).toEqual(mockMemberData);
      expect(mockPrisma.organizationMember.create).toHaveBeenCalledWith({
        data: {
          organizationId: 1,
          userId: 2,
          role: 'MEMBER',
        },
      });
    });

    test('should add member with specified MODERATOR role', async () => {
      const modData = { ...mockMemberData, role: 'MODERATOR' };
      mockPrisma.organizationMember.create.mockResolvedValue(modData);

      const result = await organizationService.addMember(1, 2, 'MODERATOR');

      expect(result).toEqual(modData);
      expect(mockPrisma.organizationMember.create).toHaveBeenCalledWith({
        data: {
          organizationId: 1,
          userId: 2,
          role: 'MODERATOR',
        },
      });
    });

    test('should add member with OWNER role', async () => {
      const ownerData = { ...mockMemberData, role: 'OWNER' };
      mockPrisma.organizationMember.create.mockResolvedValue(ownerData);

      await organizationService.addMember(1, 2, 'OWNER');

      expect(mockPrisma.organizationMember.create).toHaveBeenCalledWith({
        data: {
          organizationId: 1,
          userId: 2,
          role: 'OWNER',
        },
      });
    });

    test('should throw error when user already a member', async () => {
      mockPrisma.organizationMember.create.mockRejectedValue(new Error('Unique constraint failed'));

      await expect(organizationService.addMember(1, 2)).rejects.toThrow();
    });
  });

  describe('removeMember', () => {
    test('should remove member successfully', async () => {
      mockPrisma.organizationMember.delete.mockResolvedValue(mockMemberData);

      await organizationService.removeMember(1, 2);

      expect(mockPrisma.organizationMember.delete).toHaveBeenCalledWith({
        where: {
          userId_organizationId: {
            userId: 2,
            organizationId: 1,
          },
        },
      });
    });

    test('should throw error when member not found', async () => {
      mockPrisma.organizationMember.delete.mockRejectedValue(new Error('Not found'));

      await expect(organizationService.removeMember(1, 999)).rejects.toThrow();
    });

    test('should throw error when organization not found', async () => {
      mockPrisma.organizationMember.delete.mockRejectedValue(new Error('Not found'));

      await expect(organizationService.removeMember(999, 2)).rejects.toThrow();
    });
  });

  describe('updateMemberRole', () => {
    test('should update member role to MODERATOR', async () => {
      const updatedMember = { ...mockMemberData, role: 'MODERATOR' };
      mockPrisma.organizationMember.update.mockResolvedValue(updatedMember);

      const result = await organizationService.updateMemberRole(1, 2, 'MODERATOR');

      expect(result).toEqual(updatedMember);
      expect(mockPrisma.organizationMember.update).toHaveBeenCalledWith({
        where: {
          userId_organizationId: {
            userId: 2,
            organizationId: 1,
          },
        },
        data: {
          role: 'MODERATOR',
        },
      });
    });

    test('should update member role to OWNER', async () => {
      const updatedMember = { ...mockMemberData, role: 'OWNER' };
      mockPrisma.organizationMember.update.mockResolvedValue(updatedMember);

      await organizationService.updateMemberRole(1, 2, 'OWNER');

      expect(mockPrisma.organizationMember.update).toHaveBeenCalledWith({
        where: {
          userId_organizationId: {
            userId: 2,
            organizationId: 1,
          },
        },
        data: {
          role: 'OWNER',
        },
      });
    });

    test('should downgrade member role back to MEMBER', async () => {
      const downgraded = { ...mockMemberData, role: 'MEMBER' };
      mockPrisma.organizationMember.update.mockResolvedValue(downgraded);

      await organizationService.updateMemberRole(1, 2, 'MEMBER');

      expect(mockPrisma.organizationMember.update).toHaveBeenCalled();
    });

    test('should throw error when member not found', async () => {
      mockPrisma.organizationMember.update.mockRejectedValue(new Error('Not found'));

      await expect(organizationService.updateMemberRole(1, 999, 'MODERATOR')).rejects.toThrow();
    });
  });

  describe('getMember', () => {
    test('should return member when found', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(mockMemberData);

      const result = await organizationService.getMember(1, 2);

      expect(result).toEqual(mockMemberData);
      expect(mockPrisma.organizationMember.findUnique).toHaveBeenCalledWith({
        where: {
          userId_organizationId: {
            userId: 2,
            organizationId: 1,
          },
        },
      });
    });

    test('should return null when member not found', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

      const result = await organizationService.getMember(1, 999);

      expect(result).toBeNull();
    });

    test('should throw error when database operation fails', async () => {
      mockPrisma.organizationMember.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(organizationService.getMember(1, 2)).rejects.toThrow();
    });
  });

  describe('getMembers', () => {
    test('should return all organization members', async () => {
      const members = [
        mockMemberData,
        { ...mockMemberData, userId: 3, role: 'MODERATOR' },
        { ...mockMemberData, userId: 4, role: 'OWNER' },
      ];
      mockPrisma.organizationMember.findMany.mockResolvedValue(members);

      const result = await organizationService.getMembers(1);

      expect(result).toEqual(members);
      expect(result.length).toBe(3);
      expect(mockPrisma.organizationMember.findMany).toHaveBeenCalledWith({
        where: { organizationId: 1 },
        include: {
          user: true,
        },
      });
    });

    test('should return empty array when organization has no members', async () => {
      mockPrisma.organizationMember.findMany.mockResolvedValue([]);

      const result = await organizationService.getMembers(1);

      expect(result).toEqual([]);
    });

    test('should include user details in member records', async () => {
      const membersWithUsers = [
        {
          ...mockMemberData,
          user: { id: 2, username: 'user1', email: 'user1@example.com' },
        },
      ];
      mockPrisma.organizationMember.findMany.mockResolvedValue(membersWithUsers);

      const result = await organizationService.getMembers(1);

      expect(result[0].user).toBeDefined();
      expect(result[0].user.username).toBe('user1');
    });

    test('should throw error when database operation fails', async () => {
      mockPrisma.organizationMember.findMany.mockRejectedValue(new Error('Database error'));

      await expect(organizationService.getMembers(1)).rejects.toThrow();
    });
  });

  describe('isMember', () => {
    test('should return true when user is a member', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(mockMemberData);

      const result = await organizationService.isMember(1, 2);

      expect(result).toBe(true);
    });

    test('should return false when user is not a member', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

      const result = await organizationService.isMember(1, 999);

      expect(result).toBe(false);
    });

    test('should check specific organization membership', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

      await organizationService.isMember(1, 2);

      expect(mockPrisma.organizationMember.findUnique).toHaveBeenCalledWith({
        where: {
          userId_organizationId: {
            userId: 2,
            organizationId: 1,
          },
        },
      });
    });

    test('should throw error when database operation fails', async () => {
      mockPrisma.organizationMember.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(organizationService.isMember(1, 2)).rejects.toThrow();
    });
  });

  describe('getOrganizationWithDetails', () => {
    const sampleMembers = [
      {
        ...mockMemberData,
        userId: 1,
        role: 'OWNER',
        user: {
          id: 1,
          email: 'alice@example.com',
          username: 'alice',
          first_name: 'Alice',
          last_name: null,
          profilePictureUrl: null,
          password_hash: 'hash',
          latitude: null,
          longitude: null,
          role: 'CLIENT',
          ExpPoints: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      {
        ...mockMemberData,
        userId: 2,
        role: 'MEMBER',
        user: {
          id: 2,
          email: 'bob@example.com',
          username: 'bob',
          first_name: 'Bob',
          last_name: null,
          profilePictureUrl: null,
          password_hash: 'hash',
          latitude: null,
          longitude: null,
          role: 'CLIENT',
          ExpPoints: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ];

    const sampleEvents = [
      {
        id: 1,
        title: 'Event 1',
        description: 'First event',
        date: new Date(),
        startTime: new Date(),
        endTime: new Date(),
        private: 'PUBLIC',
        parkId: 1,
        organizerId: 1,
        organizationId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        park: { id: 1, name: 'Central Park', latitude: 40.7, longitude: -73.9, description: null, separateSmallDogArea: false, amenities: null, profilePictureUrl: null, createdAt: new Date(), updatedAt: new Date() },
        organizer: { id: 1, email: 'alice@example.com', username: 'alice', first_name: 'Alice', last_name: null, profilePictureUrl: null, password_hash: 'hash', latitude: null, longitude: null, role: 'CLIENT', ExpPoints: 0, createdAt: new Date(), updatedAt: new Date() },
      },
      {
        id: 2,
        title: 'Event 2',
        description: 'Second event',
        date: new Date(),
        startTime: new Date(),
        endTime: new Date(),
        private: 'PRIVATE',
        parkId: 1,
        organizerId: 1,
        organizationId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        park: { id: 1, name: 'Central Park', latitude: 40.7, longitude: -73.9, description: null, separateSmallDogArea: false, amenities: null, profilePictureUrl: null, createdAt: new Date(), updatedAt: new Date() },
        organizer: { id: 1, email: 'alice@example.com', username: 'alice', first_name: 'Alice', last_name: null, profilePictureUrl: null, password_hash: 'hash', latitude: null, longitude: null, role: 'CLIENT', ExpPoints: 0, createdAt: new Date(), updatedAt: new Date() },
      },
    ];

    test('should return organization with members and events', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrgData);
      mockPrisma.organizationMember.findMany.mockResolvedValue(sampleMembers);
      mockPrisma.event.findMany.mockResolvedValue(sampleEvents);

      const result = await organizationService.getOrganizationWithDetails(1);

      expect(result).toBeDefined();
      expect(result!.org).toEqual(mockOrgData);
      expect(result!.members).toEqual(sampleMembers);
      expect(result!.events).toEqual(sampleEvents);
      expect(result!.members.length).toBe(2);
      expect(result!.events.length).toBe(2);
    });

    test('should fetch members with user include', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrgData);
      mockPrisma.organizationMember.findMany.mockResolvedValue(sampleMembers);
      mockPrisma.event.findMany.mockResolvedValue([]);

      await organizationService.getOrganizationWithDetails(1);

      expect(mockPrisma.organizationMember.findMany).toHaveBeenCalledWith({
        where: { organizationId: 1 },
        include: { user: true },
      });
    });

    test('should fetch events with organizer and park include', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrgData);
      mockPrisma.organizationMember.findMany.mockResolvedValue([]);
      mockPrisma.event.findMany.mockResolvedValue(sampleEvents);

      await organizationService.getOrganizationWithDetails(1);

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
        where: { organizationId: 1 },
        include: { organizer: true, park: true },
      });
    });

    test('should return null when organization not found', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);

      const result = await organizationService.getOrganizationWithDetails(999);

      expect(result).toBeNull();
      expect(mockPrisma.organizationMember.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.event.findMany).not.toHaveBeenCalled();
    });

    test('should fetch members and events in parallel', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrgData);
      mockPrisma.organizationMember.findMany.mockResolvedValue(sampleMembers);
      mockPrisma.event.findMany.mockResolvedValue(sampleEvents);

      const result = await organizationService.getOrganizationWithDetails(1);

      expect(result).toBeDefined();
      expect(result!.members).toHaveLength(2);
      expect(result!.events).toHaveLength(2);
      // Verify both were called (would fail if one wasn't called due to early return)
      expect(mockPrisma.organizationMember.findMany).toHaveBeenCalled();
      expect(mockPrisma.event.findMany).toHaveBeenCalled();
    });

    test('should return empty members and events arrays when none exist', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrgData);
      mockPrisma.organizationMember.findMany.mockResolvedValue([]);
      mockPrisma.event.findMany.mockResolvedValue([]);

      const result = await organizationService.getOrganizationWithDetails(1);

      expect(result).toBeDefined();
      expect(result!.members).toEqual([]);
      expect(result!.events).toEqual([]);
      expect(result!.org).toEqual(mockOrgData);
    });

    test('should throw error when member fetch fails', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrgData);
      mockPrisma.organizationMember.findMany.mockRejectedValue(new Error('Database error'));
      mockPrisma.event.findMany.mockResolvedValue([]);

      await expect(organizationService.getOrganizationWithDetails(1)).rejects.toThrow('Failed to fetch organization with details');
    });

    test('should throw error when event fetch fails', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrgData);
      mockPrisma.organizationMember.findMany.mockResolvedValue(sampleMembers);
      mockPrisma.event.findMany.mockRejectedValue(new Error('Database error'));

      await expect(organizationService.getOrganizationWithDetails(1)).rejects.toThrow('Failed to fetch organization with details');
    });

    test('should throw error when organization fetch fails', async () => {
      mockPrisma.organization.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(organizationService.getOrganizationWithDetails(1)).rejects.toThrow('Failed to fetch organization with details');
    });

    test('should include user details in member objects', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrgData);
      mockPrisma.organizationMember.findMany.mockResolvedValue(sampleMembers);
      mockPrisma.event.findMany.mockResolvedValue([]);

      const result = await organizationService.getOrganizationWithDetails(1);

      expect(result!.members[0].user).toBeDefined();
      // Members are sorted by role: MEMBER (bob) comes before OWNER (alice)
      expect(result!.members[0].user.username).toBe('bob');
      expect(result!.members[1].user.username).toBe('alice');
    });

    test('should include organizer and park details in event objects', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrgData);
      mockPrisma.organizationMember.findMany.mockResolvedValue([]);
      mockPrisma.event.findMany.mockResolvedValue(sampleEvents);

      const result = await organizationService.getOrganizationWithDetails(1);

      expect(result!.events[0].organizer).toBeDefined();
      expect(result!.events[0].organizer.username).toBe('alice');
      expect(result!.events[0].park).toBeDefined();
      expect(result!.events[0].park.name).toBe('Central Park');
    });
  });
});
