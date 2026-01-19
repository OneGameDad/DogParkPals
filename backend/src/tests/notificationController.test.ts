import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import express, { Request, Response, Express } from 'express';
import request from 'supertest';

// Mock service functions
const mockGetNotifications = jest.fn() as any;
const mockMarkAsRead = jest.fn() as any;
const mockMarkAllAsRead = jest.fn() as any;

// Mock the service
jest.mock('../services/notificationService', () => ({
  __esModule: true,
  default: {
    getNotifications: mockGetNotifications,
    markAsRead: mockMarkAsRead,
    markAllAsRead: mockMarkAllAsRead,
  },
}));

jest.mock('../middlewares/authMiddleware', () => {
  return {
    __esModule: true,
    requireAuth: (req: any, res: any, next: Function) => {
      req.userId = 1; // inject user ID for tests
      next();
    },
  };
});

// Import router after mocks
import notificationRouter from '../routes/notificationRouter';

describe('Notification Router', () => {
  let app: Express;

  const mockNotifications = [
    { id: 1, type: 'MESSAGE_RECEIVED', payload: {}, readAt: null, userId: 1, createdAt: new Date() },
    { id: 2, type: 'FRIENDSHIP_REQUEST', payload: {}, readAt: new Date(), userId: 1, createdAt: new Date() },
  ];

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock auth middleware by adding userId to request
    app.use((req: Request, res: Response, next) => {
      req.userId = 1;
      next();
    });

    app.use(notificationRouter);

    app.use((err: any, req: Request, res: Response, next: Function) => {
      res.status(err.statusCode || 500).json({ message: err.message || 'Internal Server Error' });
    });

    jest.clearAllMocks();
  });

  describe('GET /notifications', () => {
    test('returns notifications with default pagination', async () => {
      mockGetNotifications.mockResolvedValue(mockNotifications);

      const res = await request(app).get('/notifications');

      expect(mockGetNotifications).toHaveBeenCalledWith(1, { page: 1, limit: 20, unreadOnly: false });
      expect(res.status).toBe(200);
      expect(res.body.notifications).toHaveLength(2);
    });

    test('supports page, limit, and unreadOnly query params', async () => {
      mockGetNotifications.mockResolvedValue([mockNotifications[0]]);

      const res = await request(app).get('/notifications?page=2&limit=1&unreadOnly=true');

      expect(mockGetNotifications).toHaveBeenCalledWith(1, { page: 2, limit: 1, unreadOnly: true });
      expect(res.status).toBe(200);
      expect(res.body.notifications).toHaveLength(1);
    });

    test('handles no notifications', async () => {
      mockGetNotifications.mockResolvedValue([]);

      const res = await request(app).get('/notifications');

      expect(res.status).toBe(200);
      expect(res.body.notifications).toEqual([]);
    });

    test('returns error if service throws', async () => {
      mockGetNotifications.mockRejectedValue(new Error('DB failure'));

      const res = await request(app).get('/notifications');

      expect(res.status).toBe(500);
      expect(res.body.message).toBeDefined();
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    test('marks a notification as read', async () => {
      mockMarkAsRead.mockResolvedValue({ ...mockNotifications[0], readAt: new Date() });

      const res = await request(app).patch('/notifications/1/read');

      expect(mockMarkAsRead).toHaveBeenCalledWith(1, 1);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', 1);
    });

    test('handles notification not found', async () => {
      mockMarkAsRead.mockResolvedValue(null);

      const res = await request(app).patch('/notifications/999/read');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'Notification not found');
    });

    test('returns error if service throws', async () => {
      mockMarkAsRead.mockRejectedValue(new Error('DB failure'));

      const res = await request(app).patch('/notifications/1/read');

      expect(res.status).toBe(500);
      expect(res.body.message).toBeDefined();
    });
  });

  describe('PATCH /notifications/read-all', () => {
    test('marks all notifications as read', async () => {
      mockMarkAllAsRead.mockResolvedValue(2);

      const res = await request(app).patch('/notifications/read-all');

      expect(mockMarkAllAsRead).toHaveBeenCalledWith(1);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('All notifications marked as read');
    });

    test('returns error if service throws', async () => {
      mockMarkAllAsRead.mockRejectedValue(new Error('DB failure'));

      const res = await request(app).patch('/notifications/read-all');

      expect(res.status).toBe(500);
      expect(res.body.message).toBeDefined();
    });
  });
});
