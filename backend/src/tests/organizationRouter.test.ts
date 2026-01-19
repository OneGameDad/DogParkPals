import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import express from 'express';

// Mock the auth middleware before importing the router
jest.mock('../middlewares/authMiddleware', () => ({
  requireAuth: (req: Request, res: Response, next: NextFunction) => {
    (req as any).userId = 1;
    next();
  },
}));

// Mock organizationController
const mockCreateOrganization = jest.fn();
const mockGetOrganizationByName = jest.fn();
const mockGetOrganizationById = jest.fn();
const mockGetOrganizations = jest.fn();
const mockUpdateOrganization = jest.fn();
const mockDeleteOrganization = jest.fn();
const mockAddMember = jest.fn();
const mockRemoveMember = jest.fn();
const mockUpdateMemberRole = jest.fn();
const mockGetMember = jest.fn();
const mockGetMembers = jest.fn();
const mockIsMember = jest.fn();
const mockGetOrganizationWithDetails = jest.fn();

jest.mock('../controllers/organizationController', () => ({
  __esModule: true,
  default: {
    createOrganization: jest.fn((req: any, res: any, next: any) => mockCreateOrganization(req, res, next)),
    getOrganizationByName: jest.fn((req: any, res: any, next: any) => mockGetOrganizationByName(req, res, next)),
    getOrganizationById: jest.fn((req: any, res: any, next: any) => mockGetOrganizationById(req, res, next)),
    getOrganizations: jest.fn((req: any, res: any, next: any) => mockGetOrganizations(req, res, next)),
    updateOrganization: jest.fn((req: any, res: any, next: any) => mockUpdateOrganization(req, res, next)),
    deleteOrganization: jest.fn((req: any, res: any, next: any) => mockDeleteOrganization(req, res, next)),
    addMember: jest.fn((req: any, res: any, next: any) => mockAddMember(req, res, next)),
    removeMember: jest.fn((req: any, res: any, next: any) => mockRemoveMember(req, res, next)),
    updateMemberRole: jest.fn((req: any, res: any, next: any) => mockUpdateMemberRole(req, res, next)),
    getMember: jest.fn((req: any, res: any, next: any) => mockGetMember(req, res, next)),
    getMembers: jest.fn((req: any, res: any, next: any) => mockGetMembers(req, res, next)),
    isMember: jest.fn((req: any, res: any, next: any) => mockIsMember(req, res, next)),
    getOrganizationWithDetails: jest.fn((req: any, res: any, next: any) => mockGetOrganizationWithDetails(req, res, next)),
  },
}));

import organizationRouter from '../routes/organizationRouter';

// Create Express app with router
const app = express();
app.use(express.json());
app.use(organizationRouter);

const mockOrgData = {
  id: 1,
  name: 'Dog Lovers Club',
  description: 'A club for dog lovers',
  profilePictureUrl: 'https://example.com/org.jpg',
  websiteUrl: 'https://dogloversclub.com',
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

describe('Organization Router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /organizations', () => {
    test('should call createOrganization with request body', async () => {
      mockCreateOrganization.mockImplementation((req: any, res: any) => {
        res.status(201).json(mockOrgData);
      });

      await request(app)
        .post('/')
        .send({ name: 'Dog Lovers Club', description: 'A club', websiteUrl: 'https://example.com' })
        .expect(201);

      expect(mockCreateOrganization).toHaveBeenCalled();
    });

    test('should pass organization data to controller', async () => {
      mockCreateOrganization.mockImplementation((req: any, res: any) => {
        expect(req.body.name).toBe('Dog Lovers Club');
        expect(req.body.description).toBe('A club');
        res.status(201).json(mockOrgData);
      });

      await request(app)
        .post('/')
        .send({ name: 'Dog Lovers Club', description: 'A club' });

      expect(mockCreateOrganization).toHaveBeenCalled();
    });
  });

  describe('GET /organizations/name/:name', () => {
    test('should call getOrganizationByName with name parameter', async () => {
      mockGetOrganizationByName.mockImplementation((req: any, res: any) => {
        res.status(200).json(mockOrgData);
      });

      await request(app)
        .get('/name/Dog%20Lovers%20Club')
        .expect(200);

      expect(mockGetOrganizationByName).toHaveBeenCalled();
    });

    test('should pass name parameter correctly', async () => {
      mockGetOrganizationByName.mockImplementation((req: any, res: any) => {
        expect(req.params.name).toBe('Dog Lovers Club');
        res.status(200).json(mockOrgData);
      });

      await request(app).get('/name/Dog%20Lovers%20Club');

      expect(mockGetOrganizationByName).toHaveBeenCalled();
    });
  });

  describe('GET /organizations/:id/details', () => {
    test('should call getOrganizationWithDetails with id parameter', async () => {
      mockGetOrganizationWithDetails.mockImplementation((req: any, res: any) => {
        res.status(200).json({
          ...mockOrgData,
          members: [mockMemberData],
          events: [],
          accessLevel: 'OWNER',
        });
      });

      await request(app)
        .get('/1/details')
        .expect(200);

      expect(mockGetOrganizationWithDetails).toHaveBeenCalled();
    });

    test('should pass id parameter correctly', async () => {
      mockGetOrganizationWithDetails.mockImplementation((req: any, res: any) => {
        expect(req.params.id).toBe('1');
        res.status(200).json({
          ...mockOrgData,
          members: [],
          events: [],
          accessLevel: 'MEMBER',
        });
      });

      await request(app).get('/1/details');

      expect(mockGetOrganizationWithDetails).toHaveBeenCalled();
    });

    test('should return organization with members and events', async () => {
      const detailedResponse = {
        ...mockOrgData,
        members: [mockMemberData],
        events: [{ id: 1, title: 'Test Event', organizationId: 1 }],
        accessLevel: 'OWNER',
      };

      mockGetOrganizationWithDetails.mockImplementation((req: any, res: any) => {
        res.status(200).json(detailedResponse);
      });

      const response = await request(app)
        .get('/1/details')
        .expect(200);

      expect(mockGetOrganizationWithDetails).toHaveBeenCalled();
      expect(response.body).toHaveProperty('members');
      expect(response.body).toHaveProperty('events');
      expect(response.body).toHaveProperty('accessLevel');
    });

    test('should pass sortBy query parameter for member sorting', async () => {
      mockGetOrganizationWithDetails.mockImplementation((req: any, res: any) => {
        expect(req.params.id).toBe('1');
        expect(req.query.sortBy).toBe('email');
        res.status(200).json({
          ...mockOrgData,
          members: [],
          events: [],
          accessLevel: 'MEMBER',
        });
      });

      await request(app).get('/1/details?sortBy=email');

      expect(mockGetOrganizationWithDetails).toHaveBeenCalled();
    });

    test('should pass both sortBy and order query parameters for member sorting', async () => {
      mockGetOrganizationWithDetails.mockImplementation((req: any, res: any) => {
        expect(req.params.id).toBe('1');
        expect(req.query.sortBy).toBe('role');
        expect(req.query.order).toBe('desc');
        res.status(200).json({
          ...mockOrgData,
          members: [],
          events: [],
          accessLevel: 'OWNER',
        });
      });

      await request(app).get('/1/details?sortBy=role&order=desc');

      expect(mockGetOrganizationWithDetails).toHaveBeenCalled();
    });
  });

  describe('GET /organizations/:id', () => {
    test('should call getOrganizationById with id parameter', async () => {
      mockGetOrganizationById.mockImplementation((req: any, res: any) => {
        res.status(200).json(mockOrgData);
      });

      await request(app)
        .get('/1')
        .expect(200);

      expect(mockGetOrganizationById).toHaveBeenCalled();
    });

    test('should pass id parameter correctly', async () => {
      mockGetOrganizationById.mockImplementation((req: any, res: any) => {
        expect(req.params.id).toBe('1');
        res.status(200).json(mockOrgData);
      });

      await request(app).get('/1');

      expect(mockGetOrganizationById).toHaveBeenCalled();
    });
  });

  describe('GET /organizations', () => {
    test('should call getOrganizations', async () => {
      mockGetOrganizations.mockImplementation((req: any, res: any) => {
        res.status(200).json([mockOrgData]);
      });

      await request(app)
        .get('/')
        .expect(200);

      expect(mockGetOrganizations).toHaveBeenCalled();
    });
  });

  describe('PUT /organizations/:id', () => {
    test('should call updateOrganization with id and body', async () => {
      mockUpdateOrganization.mockImplementation((req: any, res: any) => {
        res.status(200).json({ ...mockOrgData, name: 'Updated Name' });
      });

      await request(app)
        .put('/1')
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(mockUpdateOrganization).toHaveBeenCalled();
    });

    test('should pass id and update data correctly', async () => {
      mockUpdateOrganization.mockImplementation((req: any, res: any) => {
        expect(req.params.id).toBe('1');
        expect(req.body.name).toBe('Updated Name');
        res.status(200).json(mockOrgData);
      });

      await request(app)
        .put('/1')
        .send({ name: 'Updated Name' });

      expect(mockUpdateOrganization).toHaveBeenCalled();
    });
  });

  describe('DELETE /organizations/:id', () => {
    test('should call deleteOrganization with id parameter', async () => {
      mockDeleteOrganization.mockImplementation((req: any, res: any) => {
        res.status(204).send();
      });

      await request(app)
        .delete('/1')
        .expect(204);

      expect(mockDeleteOrganization).toHaveBeenCalled();
    });

    test('should pass id parameter correctly', async () => {
      mockDeleteOrganization.mockImplementation((req: any, res: any) => {
        expect(req.params.id).toBe('1');
        res.status(204).send();
      });

      await request(app).delete('/1');

      expect(mockDeleteOrganization).toHaveBeenCalled();
    });
  });

  describe('POST /organizations/:id/members', () => {
    test('should call addMember with organization id and member data', async () => {
      mockAddMember.mockImplementation((req: any, res: any) => {
        res.status(201).json(mockMemberData);
      });

      await request(app)
        .post('/1/members')
        .send({ userId: 2, role: 'MEMBER' })
        .expect(201);

      expect(mockAddMember).toHaveBeenCalled();
    });

    test('should pass organization id and member data correctly', async () => {
      mockAddMember.mockImplementation((req: any, res: any) => {
        expect(req.params.id).toBe('1');
        expect(req.body.userId).toBe(2);
        expect(req.body.role).toBe('MEMBER');
        res.status(201).json(mockMemberData);
      });

      await request(app)
        .post('/1/members')
        .send({ userId: 2, role: 'MEMBER' });

      expect(mockAddMember).toHaveBeenCalled();
    });
  });

  describe('DELETE /organizations/:id/members/:memberId', () => {
    test('should call removeMember with organization and member ids', async () => {
      mockRemoveMember.mockImplementation((req: any, res: any) => {
        res.status(200).json({ message: 'Member removed' });
      });

      await request(app)
        .delete('/1/members/2')
        .expect(200);

      expect(mockRemoveMember).toHaveBeenCalled();
    });

    test('should pass both id parameters correctly', async () => {
      mockRemoveMember.mockImplementation((req: any, res: any) => {
        expect(req.params.id).toBe('1');
        expect(req.params.memberId).toBe('2');
        res.status(200).json({ message: 'Member removed' });
      });

      await request(app).delete('/1/members/2');

      expect(mockRemoveMember).toHaveBeenCalled();
    });
  });

  describe('PUT /organizations/:id/members/:memberId', () => {
    test('should call updateMemberRole with organization and member ids', async () => {
      mockUpdateMemberRole.mockImplementation((req: any, res: any) => {
        res.status(200).json({ ...mockMemberData, role: 'MODERATOR' });
      });

      await request(app)
        .put('/1/members/2')
        .send({ role: 'MODERATOR' })
        .expect(200);

      expect(mockUpdateMemberRole).toHaveBeenCalled();
    });

    test('should pass parameters and role data correctly', async () => {
      mockUpdateMemberRole.mockImplementation((req: any, res: any) => {
        expect(req.params.id).toBe('1');
        expect(req.params.memberId).toBe('2');
        expect(req.body.role).toBe('MODERATOR');
        res.status(200).json(mockMemberData);
      });

      await request(app)
        .put('/1/members/2')
        .send({ role: 'MODERATOR' });

      expect(mockUpdateMemberRole).toHaveBeenCalled();
    });
  });

  describe('GET /organizations/:id/members/:memberId', () => {
    test('should call getMember with organization and member ids', async () => {
      mockGetMember.mockImplementation((req: any, res: any) => {
        res.status(200).json(mockMemberData);
      });

      await request(app)
        .get('/1/members/2')
        .expect(200);

      expect(mockGetMember).toHaveBeenCalled();
    });

    test('should pass both id parameters correctly', async () => {
      mockGetMember.mockImplementation((req: any, res: any) => {
        expect(req.params.id).toBe('1');
        expect(req.params.memberId).toBe('2');
        res.status(200).json(mockMemberData);
      });

      await request(app).get('/1/members/2');

      expect(mockGetMember).toHaveBeenCalled();
    });
  });

  describe('GET /organizations/:id/members', () => {
    test('should call getMembers with organization id', async () => {
      mockGetMembers.mockImplementation((req: any, res: any) => {
        res.status(200).json([mockMemberData]);
      });

      await request(app)
        .get('/1/members')
        .expect(200);

      expect(mockGetMembers).toHaveBeenCalled();
    });

    test('should pass organization id correctly', async () => {
      mockGetMembers.mockImplementation((req: any, res: any) => {
        expect(req.params.id).toBe('1');
        res.status(200).json([mockMemberData]);
      });

      await request(app).get('/1/members');

      expect(mockGetMembers).toHaveBeenCalled();
    });

    test('should pass sortBy query parameter correctly', async () => {
      mockGetMembers.mockImplementation((req: any, res: any) => {
        expect(req.params.id).toBe('1');
        expect(req.query.sortBy).toBe('username');
        res.status(200).json([mockMemberData]);
      });

      await request(app).get('/1/members?sortBy=username');

      expect(mockGetMembers).toHaveBeenCalled();
    });

    test('should pass order query parameter correctly', async () => {
      mockGetMembers.mockImplementation((req: any, res: any) => {
        expect(req.params.id).toBe('1');
        expect(req.query.order).toBe('desc');
        res.status(200).json([mockMemberData]);
      });

      await request(app).get('/1/members?order=desc');

      expect(mockGetMembers).toHaveBeenCalled();
    });

    test('should pass both sortBy and order query parameters', async () => {
      mockGetMembers.mockImplementation((req: any, res: any) => {
        expect(req.params.id).toBe('1');
        expect(req.query.sortBy).toBe('joinedAt');
        expect(req.query.order).toBe('desc');
        res.status(200).json([mockMemberData]);
      });

      await request(app).get('/1/members?sortBy=joinedAt&order=desc');

      expect(mockGetMembers).toHaveBeenCalled();
    });
  });

  describe('GET /organizations/:id/members/:userId/is-member', () => {
    test('should call isMember with organization and user ids', async () => {
      mockIsMember.mockImplementation((req: any, res: any) => {
        res.status(200).json({ isMember: true });
      });

      await request(app)
        .get('/1/members/2/is-member')
        .expect(200);

      expect(mockIsMember).toHaveBeenCalled();
    });

    test('should pass both id parameters correctly', async () => {
      mockIsMember.mockImplementation((req: any, res: any) => {
        expect(req.params.id).toBe('1');
        expect(req.params.userId).toBe('2');
        res.status(200).json({ isMember: true });
      });

      await request(app).get('/1/members/2/is-member');

      expect(mockIsMember).toHaveBeenCalled();
    });

    test('should return false when user is not a member', async () => {
      mockIsMember.mockImplementation((req: any, res: any) => {
        res.status(200).json({ isMember: false });
      });

      const response = await request(app)
        .get('/1/members/999/is-member')
        .expect(200);

      expect(mockIsMember).toHaveBeenCalled();
      expect(response.body.isMember).toBe(false);
    });
  });
});
