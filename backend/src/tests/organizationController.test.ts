import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { NotFoundError, ConflictError, ForbiddenError, AppError } from '../utils/errors';

// Mock organizationService
const mockGetOrganizationById = jest.fn<any>();
const mockGetOrganizationByName = jest.fn<any>();
const mockGetOrganizations = jest.fn<any>();
const mockCreateOrganization = jest.fn<any>();
const mockUpdateOrganization = jest.fn<any>();
const mockDeleteOrganization = jest.fn<any>();
const mockAddMember = jest.fn<any>();
const mockRemoveMember = jest.fn<any>();
const mockUpdateMemberRole = jest.fn<any>();
const mockGetMember = jest.fn<any>();
const mockGetMembers = jest.fn<any>();
const mockIsMember = jest.fn<any>();

jest.mock('../services/organizationService', () => ({
  __esModule: true,
  default: {
    getOrganizationById: mockGetOrganizationById,
    getOrganizationByName: mockGetOrganizationByName,
    getOrganizations: mockGetOrganizations,
    createOrganization: mockCreateOrganization,
    updateOrganization: mockUpdateOrganization,
    deleteOrganization: mockDeleteOrganization,
    addMember: mockAddMember,
    removeMember: mockRemoveMember,
    updateMemberRole: mockUpdateMemberRole,
    getMember: mockGetMember,
    getMembers: mockGetMembers,
    isMember: mockIsMember,
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

const mockSanitizeOrganization = jest.fn();
jest.mock('../utils/organizationSanitizer', () => ({
  sanitizeOrganization: mockSanitizeOrganization,
}));

// Import after all mocks
import organizationController from '../controllers/organizationController';

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

const mockSanitizedOrgData = {
  id: 1,
  name: 'Dog Lovers Club',
  profilePictureUrl: 'https://example.com/org.jpg',
  websiteUrl: 'https://dogloversclub.com',
  description: 'A club for dog lovers',
  ownerId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockMemberData = {
  userId: 2,
  organizationId: 1,
  role: 'MEMBER',
  joinedAt: new Date(),
};

describe('Organization Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockSend: jest.Mock;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockJson = jest.fn().mockReturnValue(undefined);
    mockSend = jest.fn().mockReturnValue(undefined);
    mockStatus = jest.fn().mockReturnValue({ json: mockJson, send: mockSend });

    mockReq = {
      body: {},
      params: {},
      query: {},
      method: 'GET',
      path: '/organizations',
    };

    mockRes = {
      status: mockStatus,
      json: mockJson,
      send: mockSend,
    };

    mockNext = jest.fn() as unknown as jest.Mock;

    // Default parseValidation behavior
    mockParseValidation.mockImplementation((schema, data) => data);
    
    // Default sanitizeOrganization behavior
    mockSanitizeOrganization.mockImplementation((org) => mockSanitizedOrgData);
  });

  describe('createOrganization', () => {
    test('should create organization successfully', async () => {
      mockReq.body = { name: 'Dog Lovers Club', description: 'A club', websiteUrl: 'https://example.com', userId: 1 };
      mockParseValidation.mockReturnValue({ name: 'Dog Lovers Club', description: 'A club', websiteUrl: 'https://example.com' });
      mockGetOrganizationByName.mockResolvedValue(null);
      mockCreateOrganization.mockResolvedValue(mockOrgData);
      mockAddMember.mockResolvedValue({ ...mockMemberData, role: 'OWNER' });

      await organizationController.createOrganization(mockReq as Request, mockRes as Response, mockNext);

      expect(mockCreateOrganization).toHaveBeenCalledWith('Dog Lovers Club', 'A club', 'https://example.com');
      expect(mockAddMember).toHaveBeenCalledWith(1, 1, 'OWNER');
      expect(mockSanitizeOrganization).toHaveBeenCalledWith(mockOrgData, true, 'OWNER');
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(mockSanitizedOrgData);
    });

    test('should return conflict error when organization name exists', async () => {
      mockReq.body = { name: 'Existing Club', description: 'A club' };
      mockParseValidation.mockReturnValue({ name: 'Existing Club', description: 'A club' });
      mockGetOrganizationByName.mockResolvedValue(mockOrgData);

      await organizationController.createOrganization(mockReq as Request, mockRes as Response, mockNext);

      expect(mockCreateOrganization).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    test('should handle validation errors', async () => {
      mockParseValidation.mockImplementation(() => {
        throw new Error('Validation failed');
      });

      await organizationController.createOrganization(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('getOrganizationByName', () => {
    test('should return organization when found', async () => {
      mockReq.params = { name: 'Dog Lovers Club' };
      (mockReq as any).user = { id: 1, role: 'CLIENT' };
      mockParseValidation.mockReturnValue({ name: 'Dog Lovers Club' });
      mockGetOrganizationByName.mockResolvedValue(mockOrgData);
      mockGetMember.mockResolvedValue(null);

      await organizationController.getOrganizationByName(mockReq as Request, mockRes as Response, mockNext);

      expect(mockGetOrganizationByName).toHaveBeenCalledWith('Dog Lovers Club');
      expect(mockGetMember).toHaveBeenCalledWith(1, 1);
      expect(mockSanitizeOrganization).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockSanitizedOrgData);
    });

    test('should throw not found error when organization does not exist', async () => {
      mockReq.params = { name: 'Nonexistent Club' };
      mockParseValidation.mockReturnValue({ name: 'Nonexistent Club' });
      mockGetOrganizationByName.mockResolvedValue(null);

      await organizationController.getOrganizationByName(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('getOrganizationById', () => {
    test('should return organization when found', async () => {
      mockReq.params = { id: '1' };
      (mockReq as any).user = { id: 1, role: 'CLIENT' };
      mockParseValidation.mockReturnValue({ organizationId: 1 });
      mockGetOrganizationById.mockResolvedValue(mockOrgData);
      mockGetMember.mockResolvedValue(null);

      await organizationController.getOrganizationById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockGetOrganizationById).toHaveBeenCalledWith(1);
      expect(mockGetMember).toHaveBeenCalledWith(1, 1);
      expect(mockSanitizeOrganization).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockSanitizedOrgData);
    });

    test('should throw not found error when organization does not exist', async () => {
      mockReq.params = { id: '999' };
      mockParseValidation.mockReturnValue({ organizationId: 999 });
      mockGetOrganizationById.mockResolvedValue(null);

      await organizationController.getOrganizationById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('getOrganizations', () => {
    test('should return all organizations', async () => {
      (mockReq as any).user = { id: 1, role: 'CLIENT' };
      const orgs = [mockOrgData, { ...mockOrgData, id: 2, name: 'Cat Lovers Club' }];
      mockGetOrganizations.mockResolvedValue(orgs);
      mockGetMember.mockResolvedValue(null);

      await organizationController.getOrganizations(mockReq as Request, mockRes as Response, mockNext);

      expect(mockGetOrganizations).toHaveBeenCalled();
      expect(mockGetMember).toHaveBeenCalledTimes(2);
      expect(mockSanitizeOrganization).toHaveBeenCalledTimes(2);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith([mockSanitizedOrgData, mockSanitizedOrgData]);
    });

    test('should handle service errors', async () => {
      mockGetOrganizations.mockRejectedValue(new Error('Database error'));

      await organizationController.getOrganizations(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('updateOrganization', () => {
    test('should update organization when user is OWNER', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = { name: 'Updated Name', userId: 1 };
      mockParseValidation
        .mockReturnValueOnce({ organizationId: 1 })
        .mockReturnValueOnce({ name: 'Updated Name' });
      mockGetOrganizationById.mockResolvedValue(mockOrgData);
      mockGetMember.mockResolvedValue({ ...mockMemberData, userId: 1, role: 'OWNER' });
      const updatedOrg = { ...mockOrgData, name: 'Updated Name' };
      mockUpdateOrganization.mockResolvedValue(updatedOrg);

      await organizationController.updateOrganization(mockReq as Request, mockRes as Response, mockNext);

      expect(mockUpdateOrganization).toHaveBeenCalled();
      expect(mockSanitizeOrganization).toHaveBeenCalledWith(updatedOrg, true, 'OWNER');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockSanitizedOrgData);
    });

    test('should throw forbidden error when user is not authorized', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = { name: 'Updated Name', userId: 2 };
      mockParseValidation
        .mockReturnValueOnce({ organizationId: 1 })
        .mockReturnValueOnce({ name: 'Updated Name' });
      mockGetOrganizationById.mockResolvedValue(mockOrgData);
      mockGetMember.mockResolvedValue({ ...mockMemberData, userId: 2, role: 'MEMBER' });

      await organizationController.updateOrganization(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockUpdateOrganization).not.toHaveBeenCalled();
    });

    test('should allow MODERATOR to update organization', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = { description: 'Updated description', userId: 2 };
      mockParseValidation
        .mockReturnValueOnce({ organizationId: 1 })
        .mockReturnValueOnce({ description: 'Updated description' });
      mockGetOrganizationById.mockResolvedValue(mockOrgData);
      mockGetMember.mockResolvedValue({ ...mockMemberData, userId: 2, role: 'MODERATOR' });
      mockUpdateOrganization.mockResolvedValue({ ...mockOrgData, description: 'Updated description' });

      await organizationController.updateOrganization(mockReq as Request, mockRes as Response, mockNext);

      expect(mockUpdateOrganization).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteOrganization', () => {
    test('should delete organization when user is OWNER', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = { userId: 1 };
      mockParseValidation.mockReturnValue({ organizationId: 1 });
      mockGetOrganizationById.mockResolvedValue(mockOrgData);
      mockGetMember.mockResolvedValue({ ...mockMemberData, userId: 1, role: 'OWNER' });
      mockDeleteOrganization.mockResolvedValue(mockOrgData);

      await organizationController.deleteOrganization(mockReq as Request, mockRes as Response, mockNext);

      expect(mockDeleteOrganization).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(204);
      expect(mockSend).toHaveBeenCalled();
    });

    test('should throw forbidden error when user is not authorized', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = { userId: 2 };
      mockParseValidation.mockReturnValue({ organizationId: 1 });
      mockGetOrganizationById.mockResolvedValue(mockOrgData);
      mockGetMember.mockResolvedValue({ ...mockMemberData, userId: 2, role: 'MEMBER' });

      await organizationController.deleteOrganization(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockDeleteOrganization).not.toHaveBeenCalled();
    });
  });

  describe('addMember', () => {
    test('should add member when user is authorized', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = { userId: 3, role: 'MEMBER', currentUserId: 1 };
      mockParseValidation.mockReturnValue({ organizationId: 1, userId: 3, role: 'MEMBER' });
      mockGetOrganizationById.mockResolvedValue(mockOrgData);
      mockGetMember.mockResolvedValue({ ...mockMemberData, userId: 1, role: 'OWNER' });
      mockAddMember.mockResolvedValue({ userId: 3, organizationId: 1, role: 'MEMBER' });

      await organizationController.addMember(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAddMember).toHaveBeenCalledWith(1, 3, 'MEMBER');
      expect(mockStatus).toHaveBeenCalledWith(201);
    });

    test('should throw forbidden error when user is not authorized', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = { userId: 3, role: 'MEMBER', currentUserId: 2 };
      mockParseValidation.mockReturnValue({ organizationId: 1, userId: 3, role: 'MEMBER' });
      mockGetOrganizationById.mockResolvedValue(mockOrgData);
      mockGetMember.mockResolvedValue({ ...mockMemberData, userId: 2, role: 'MEMBER' });

      await organizationController.addMember(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockAddMember).not.toHaveBeenCalled();
    });
  });

  describe('removeMember', () => {
    test('should remove member when user is authorized', async () => {
      mockReq.params = { id: '1', memberId: '3' };
      mockReq.body = { userId: 1 };
      mockParseValidation.mockReturnValue({ organizationId: 1, userId: 3 });
      mockGetOrganizationById.mockResolvedValue(mockOrgData);
      mockGetMember.mockResolvedValue({ ...mockMemberData, userId: 1, role: 'OWNER' });
      mockRemoveMember.mockResolvedValue(undefined);

      await organizationController.removeMember(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRemoveMember).toHaveBeenCalledWith(1, 3);
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    test('should throw forbidden error when user is not authorized', async () => {
      mockReq.params = { id: '1', memberId: '3' };
      mockReq.body = { userId: 2 };
      mockParseValidation.mockReturnValue({ organizationId: 1, userId: 3 });
      mockGetOrganizationById.mockResolvedValue(mockOrgData);
      mockGetMember.mockResolvedValue({ ...mockMemberData, userId: 2, role: 'MEMBER' });

      await organizationController.removeMember(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRemoveMember).not.toHaveBeenCalled();
    });
  });

  describe('updateMemberRole', () => {
    test('should update member role when user is authorized', async () => {
      mockReq.params = { id: '1', memberId: '3' };
      mockReq.body = { role: 'MODERATOR', userId: 1 };
      mockParseValidation.mockReturnValue({ organizationId: 1, userId: 3, role: 'MODERATOR' });
      mockGetOrganizationById.mockResolvedValue(mockOrgData);
      mockGetMember.mockResolvedValue({ ...mockMemberData, userId: 1, role: 'OWNER' });
      mockUpdateMemberRole.mockResolvedValue({ userId: 3, organizationId: 1, role: 'MODERATOR' });

      await organizationController.updateMemberRole(mockReq as Request, mockRes as Response, mockNext);

      expect(mockUpdateMemberRole).toHaveBeenCalledWith(1, 3, 'MODERATOR');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    test('should throw forbidden error when user is not authorized', async () => {
      mockReq.params = { id: '1', memberId: '3' };
      mockReq.body = { role: 'MODERATOR', userId: 2 };
      mockParseValidation.mockReturnValue({ organizationId: 1, userId: 3, role: 'MODERATOR' });
      mockGetOrganizationById.mockResolvedValue(mockOrgData);
      mockGetMember.mockResolvedValue({ ...mockMemberData, userId: 2, role: 'MEMBER' });

      await organizationController.updateMemberRole(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockUpdateMemberRole).not.toHaveBeenCalled();
    });
  });

  describe('getMember', () => {
    test('should return member when found', async () => {
      mockReq.params = { id: '1', memberId: '2' };
      mockParseValidation.mockReturnValue({ organizationId: 1, userId: 2 });
      mockGetMember.mockResolvedValue(mockMemberData);

      await organizationController.getMember(mockReq as Request, mockRes as Response, mockNext);

      expect(mockGetMember).toHaveBeenCalledWith(1, 2);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockMemberData);
    });

    test('should throw not found error when member does not exist', async () => {
      mockReq.params = { id: '1', memberId: '999' };
      mockParseValidation.mockReturnValue({ organizationId: 1, userId: 999 });
      mockGetMember.mockResolvedValue(null);

      await organizationController.getMember(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('getMembers', () => {
    test('should return all members of organization', async () => {
      mockReq.params = { id: '1' };
      mockParseValidation.mockReturnValue({ organizationId: 1 });
      const members = [
        mockMemberData,
        { ...mockMemberData, userId: 3, role: 'MODERATOR' },
      ];
      mockGetMembers.mockResolvedValue(members);

      await organizationController.getMembers(mockReq as Request, mockRes as Response, mockNext);

      expect(mockGetMembers).toHaveBeenCalledWith(1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(members);
    });

    test('should handle service errors', async () => {
      mockReq.params = { id: '1' };
      mockParseValidation.mockReturnValue({ organizationId: 1 });
      mockGetMembers.mockRejectedValue(new Error('Database error'));

      await organizationController.getMembers(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('isMember', () => {
    test('should return true when user is a member', async () => {
      mockReq.params = { id: '1', userId: '2' };
      mockParseValidation.mockReturnValue({ organizationId: 1, userId: 2 });
      mockIsMember.mockResolvedValue(true);

      await organizationController.isMember(mockReq as Request, mockRes as Response, mockNext);

      expect(mockIsMember).toHaveBeenCalledWith(1, 2);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ isMember: true });
    });

    test('should return false when user is not a member', async () => {
      mockReq.params = { id: '1', userId: '999' };
      mockParseValidation.mockReturnValue({ organizationId: 1, userId: 999 });
      mockIsMember.mockResolvedValue(false);

      await organizationController.isMember(mockReq as Request, mockRes as Response, mockNext);

      expect(mockIsMember).toHaveBeenCalledWith(1, 999);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ isMember: false });
    });
  });
});
