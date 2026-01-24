import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import express from 'express';

// Mock the auth middleware before importing the router
let mockUserRole = 'CLIENT';

jest.mock('../middlewares/authMiddleware', () => ({
  requireAuth: (req: Request, res: Response, next: NextFunction) => {
    (req as any).userId = 1;
    (req as any).user = { id: 1, role: mockUserRole };
    next();
  },
}));

// Mock the authorization middleware
jest.mock('../middlewares/authorizationMiddleware', () => ({
  requireRole: (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;
      if (user && roles.includes(user.role)) {
        next();
      } else {
        res.status(403).json({ error: 'Forbidden' });
      }
    };
  },
}));

import achievementRouter from '../routes/achievementRouter';

// Mock achievementController
const mockGetAllAchievements = jest.fn();
const mockGetAchievementById = jest.fn();
const mockGetAchievementByName = jest.fn();
const mockCreateAchievement = jest.fn();
const mockUpdateAchievement = jest.fn();
const mockDeleteAchievement = jest.fn();
const mockAwardAchievementToUser = jest.fn();
const mockGetUserAchievements = jest.fn();
const mockRemoveAchievementFromUser = jest.fn();

jest.mock('../controllers/achievementController', () => ({
  __esModule: true,
  default: {
    getAllAchievements: (req: any, res: any, next: any) => mockGetAllAchievements(req, res, next),
    getAchievementById: (req: any, res: any, next: any) => mockGetAchievementById(req, res, next),
    getAchievementByName: (req: any, res: any, next: any) => mockGetAchievementByName(req, res, next),
    createAchievement: (req: any, res: any, next: any) => mockCreateAchievement(req, res, next),
    updateAchievement: (req: any, res: any, next: any) => mockUpdateAchievement(req, res, next),
    deleteAchievement: (req: any, res: any, next: any) => mockDeleteAchievement(req, res, next),
    awardAchievementToUser: (req: any, res: any, next: any) => mockAwardAchievementToUser(req, res, next),
    getUserAchievements: (req: any, res: any, next: any) => mockGetUserAchievements(req, res, next),
    removeAchievementFromUser: (req: any, res: any, next: any) => mockRemoveAchievementFromUser(req, res, next),
  },
}));

// Create Express app with router
const app = express();
app.use(express.json());
app.use(achievementRouter);

const mockAchievementData = {
  id: 1,
  name: 'First Visit',
  type: 'BADGE',
  description: 'Visit your first dog park',
  badgeUrl: 'https://example.com/badge.png',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('Achievement Router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRole = 'CLIENT'; // Reset to default CLIENT role
  });

  describe('GET / - Get all achievements (authenticated)', () => {
    test('should call getAllAchievements with authentication', async () => {
      mockGetAllAchievements.mockImplementation((req, res) => {
        res.status(200).json([mockAchievementData]);
      });

      await request(app)
        .get('/')
        .expect(200);

      expect(mockGetAllAchievements).toHaveBeenCalled();
    });

    test('should return achievements list', async () => {
      mockGetAllAchievements.mockImplementation((req, res) => {
        res.status(200).json([mockAchievementData, { ...mockAchievementData, id: 2 }]);
      });

      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(mockGetAllAchievements).toHaveBeenCalled();
    });
  });

  describe('GET /search - Get achievement by name (authenticated)', () => {
    test('should call getAchievementByName with query parameter', async () => {
      mockGetAchievementByName.mockImplementation((req, res) => {
        res.status(200).json(mockAchievementData);
      });

      await request(app)
        .get('/search')
        .query({ name: 'First Visit' })
        .expect(200);

      expect(mockGetAchievementByName).toHaveBeenCalled();
    });

    test('should pass name query parameter to controller', async () => {
      mockGetAchievementByName.mockImplementation((req, res) => {
        expect(req.query.name).toBe('First Visit');
        res.status(200).json(mockAchievementData);
      });

      await request(app)
        .get('/search')
        .query({ name: 'First Visit' });

      expect(mockGetAchievementByName).toHaveBeenCalled();
    });
  });

  describe('GET /:id - Get achievement by ID (authenticated)', () => {
    test('should call getAchievementById with id parameter', async () => {
      mockGetAchievementById.mockImplementation((req, res) => {
        res.status(200).json(mockAchievementData);
      });

      await request(app)
        .get('/1')
        .expect(200);

      expect(mockGetAchievementById).toHaveBeenCalled();
    });

    test('should pass id parameter to controller', async () => {
      mockGetAchievementById.mockImplementation((req, res) => {
        expect(req.params.id).toBe('1');
        res.status(200).json(mockAchievementData);
      });

      await request(app).get('/1');

      expect(mockGetAchievementById).toHaveBeenCalled();
    });
  });

  describe('GET /user/:userId - Get user achievements (authenticated)', () => {
    test('should call getUserAchievements with userId parameter', async () => {
      mockGetUserAchievements.mockImplementation((req, res) => {
        res.status(200).json([]);
      });

      await request(app)
        .get('/user/1')
        .expect(200);

      expect(mockGetUserAchievements).toHaveBeenCalled();
    });

    test('should pass userId parameter to controller', async () => {
      mockGetUserAchievements.mockImplementation((req, res) => {
        expect(req.params.userId).toBe('1');
        res.status(200).json([]);
      });

      await request(app).get('/user/1');

      expect(mockGetUserAchievements).toHaveBeenCalled();
    });

    test('should return user achievements list', async () => {
      mockGetUserAchievements.mockImplementation((req, res) => {
        res.status(200).json([
          {
            userId: 1,
            achievementId: 1,
            dateEarned: new Date().toISOString(),
            achievement: mockAchievementData,
          },
        ]);
      });

      const response = await request(app)
        .get('/user/1')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(mockGetUserAchievements).toHaveBeenCalled();
    });
  });

  describe('POST /award - Award achievement to user (admin/developer only)', () => {
    test('should call awardAchievementToUser as admin', async () => {
      mockUserRole = 'ADMIN'; // Set role to ADMIN for this test
      mockAwardAchievementToUser.mockImplementation((req, res) => {
        res.status(201).json({
          userId: 1,
          achievementId: 1,
          dateEarned: new Date().toISOString(),
        });
      });

      await request(app)
        .post('/award')
        .send({ userId: 1, achievementId: 1 })
        .expect(201);

      expect(mockAwardAchievementToUser).toHaveBeenCalled();
    });

    test('should pass userId and achievementId to controller as developer', async () => {
      mockUserRole = 'DEVELOPER'; // Set role to DEVELOPER for this test
      mockAwardAchievementToUser.mockImplementation((req, res) => {
        expect(req.body.userId).toBe(1);
        expect(req.body.achievementId).toBe(1);
        res.status(201).json({ userId: 1, achievementId: 1 });
      });

      await request(app)
        .post('/award')
        .send({ userId: 1, achievementId: 1 });

      expect(mockAwardAchievementToUser).toHaveBeenCalled();
    });

    test('should reject awarding as non-admin user', async () => {
      mockUserRole = 'CLIENT'; // Regular user
      mockAwardAchievementToUser.mockImplementation((req, res) => {
        res.status(201).json({ userId: 1, achievementId: 1 });
      });

      await request(app)
        .post('/award')
        .send({ userId: 1, achievementId: 1 })
        .expect(403);

      expect(mockAwardAchievementToUser).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /user/:userId/:achievementId - Remove achievement from user (admin/developer only)', () => {
    test('should call removeAchievementFromUser as admin', async () => {
      mockUserRole = 'ADMIN'; // Set role to ADMIN for this test
      mockRemoveAchievementFromUser.mockImplementation((req, res) => {
        res.status(204).send();
      });

      await request(app)
        .delete('/user/1/1')
        .expect(204);

      expect(mockRemoveAchievementFromUser).toHaveBeenCalled();
    });

    test('should pass userId and achievementId as developer', async () => {
      mockUserRole = 'DEVELOPER'; // Set role to DEVELOPER for this test
      mockRemoveAchievementFromUser.mockImplementation((req, res) => {
        expect(req.params.userId).toBe('1');
        expect(req.params.achievementId).toBe('1');
        res.status(204).send();
      });

      await request(app).delete('/user/1/1');

      expect(mockRemoveAchievementFromUser).toHaveBeenCalled();
    });

    test('should reject removal as non-admin user', async () => {
      mockUserRole = 'CLIENT'; // Regular user
      mockRemoveAchievementFromUser.mockImplementation((req, res) => {
        res.status(204).send();
      });

      await request(app)
        .delete('/user/1/1')
        .expect(403);

      expect(mockRemoveAchievementFromUser).not.toHaveBeenCalled();
    });
  });

  describe('POST / - Create achievement (admin/developer only)', () => {
    test('should call createAchievement with request body when user is admin', async () => {
      mockUserRole = 'ADMIN'; // Set role to ADMIN for this test
      mockCreateAchievement.mockImplementation((req, res) => {
        res.status(201).json(mockAchievementData);
      });

      await request(app)
        .post('/')
        .send({
          name: 'New Achievement',
          type: 'BADGE',
          description: 'Test achievement',
        })
        .expect(201);

      expect(mockCreateAchievement).toHaveBeenCalled();
    });

    test('should pass achievement data to controller', async () => {
      mockUserRole = 'ADMIN'; // Set role to ADMIN for this test
      mockCreateAchievement.mockImplementation((req, res) => {
        expect(req.body.name).toBe('New Achievement');
        expect(req.body.type).toBe('BADGE');
        res.status(201).json(mockAchievementData);
      });

      await request(app)
        .post('/')
        .send({
          name: 'New Achievement',
          type: 'BADGE',
        });

      expect(mockCreateAchievement).toHaveBeenCalled();
    });
  });

  describe('PUT /:id - Update achievement (admin/developer only)', () => {
    test('should call updateAchievement with id and request body', async () => {
      mockUserRole = 'ADMIN'; // Set role to ADMIN for this test
      mockUpdateAchievement.mockImplementation((req, res) => {
        res.status(200).json({ ...mockAchievementData, description: 'Updated' });
      });

      await request(app)
        .put('/1')
        .send({ description: 'Updated description' })
        .expect(200);

      expect(mockUpdateAchievement).toHaveBeenCalled();
    });

    test('should pass id and update data to controller', async () => {
      mockUserRole = 'DEVELOPER'; // Set role to DEVELOPER for this test
      mockUpdateAchievement.mockImplementation((req, res) => {
        expect(req.params.id).toBe('1');
        expect(req.body.description).toBe('Updated description');
        res.status(200).json(mockAchievementData);
      });

      await request(app)
        .put('/1')
        .send({ description: 'Updated description' });

      expect(mockUpdateAchievement).toHaveBeenCalled();
    });
  });

  describe('DELETE /:id - Delete achievement (admin/developer only)', () => {
    test('should call deleteAchievement with id parameter', async () => {
      mockUserRole = 'ADMIN'; // Set role to ADMIN for this test
      mockDeleteAchievement.mockImplementation((req, res) => {
        res.status(204).send();
      });

      await request(app)
        .delete('/1')
        .expect(204);

      expect(mockDeleteAchievement).toHaveBeenCalled();
    });

    test('should pass id parameter to controller', async () => {
      mockUserRole = 'DEVELOPER'; // Set role to DEVELOPER for this test
      mockDeleteAchievement.mockImplementation((req, res) => {
        expect(req.params.id).toBe('1');
        res.status(204).send();
      });

      await request(app).delete('/1');

      expect(mockDeleteAchievement).toHaveBeenCalled();
    });
  });

  describe('Route ordering', () => {
    test('should match /search before /:id route', async () => {
      mockGetAchievementByName.mockImplementation((req, res) => {
        res.status(200).json(mockAchievementData);
      });

      // This should hit the /search route, not the /:id route
      await request(app)
        .get('/search')
        .query({ name: 'Test' })
        .expect(200);

      expect(mockGetAchievementByName).toHaveBeenCalled();
      expect(mockGetAchievementById).not.toHaveBeenCalled();
    });
  });
});
