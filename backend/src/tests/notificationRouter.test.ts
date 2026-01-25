import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import express from 'express';
import request from 'supertest';

// Mock the auth middleware before importing the router
jest.mock('../middlewares/authMiddleware', () => ({
  requireAuth: (req: Request, res: Response, next: NextFunction) => {
    (req as any).userId = 1;
    next();
  },
}));

const getNotificationsMock = jest.fn();
const markAsReadMock = jest.fn();
const markAllAsReadMock = jest.fn();

jest.mock('../controllers/notificationController', () => ({
  __esModule: true,
  default: {
    getNotifications: getNotificationsMock,
    markAsRead: markAsReadMock,
    markAllAsRead: markAllAsReadMock,
  },
}));

import notificationRouter from '../routes/notificationRouter';

const okHandler = (name: string) => (req: Request, res: Response) =>
  res.status(200).json({ handler: name, params: req.params, body: req.body, query: req.query });

const defaultHandlers = () => {
  getNotificationsMock.mockImplementation(okHandler('getNotifications'));
  markAsReadMock.mockImplementation(okHandler('markAsRead'));
  markAllAsReadMock.mockImplementation(okHandler('markAllAsRead'));
};

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(notificationRouter);
  return app;
};

describe('Notification Router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    defaultHandlers();
  });

  test('GET / routes to getNotifications', async () => {
    const response = await request(buildApp()).get('/');

    expect(response.status).toBe(200);
    expect(response.body.handler).toBe('getNotifications');
    expect(getNotificationsMock).toHaveBeenCalledTimes(1);
  });

  test('PATCH /read-all routes to markAllAsRead', async () => {
    const response = await request(buildApp()).patch('/read-all');

    expect(response.status).toBe(200);
    expect(response.body.handler).toBe('markAllAsRead');
    expect(markAllAsReadMock).toHaveBeenCalledTimes(1);
  });

  test('PATCH /:id/read routes to markAsRead', async () => {
    const response = await request(buildApp()).patch('/1/read');

    expect(response.status).toBe(200);
    expect(response.body.handler).toBe('markAsRead');
    expect(markAsReadMock).toHaveBeenCalledTimes(1);
    expect(markAsReadMock.mock.calls[0][0].params.id).toBe('1');
  });

  describe('Route ordering', () => {
    test('should match specific route /read-all before generic /:id', async () => {
      markAllAsReadMock.mockImplementation((req, res) => {
        res.status(200).json({ type: 'readAll' });
      });

      const response = await request(buildApp()).patch('/read-all');

      expect(response.body.type).toBe('readAll');
      expect(markAllAsReadMock).toHaveBeenCalled();
      expect(markAsReadMock).not.toHaveBeenCalled();
    });
  });
});
