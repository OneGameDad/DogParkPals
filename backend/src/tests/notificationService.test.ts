import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import notificationService from '../services/notificationService';
import { PrismaClient } from '@prisma/client';
import typeSafeLogger from '../utils/typeSafeLogger';
import { toAppError } from '../utils/errors';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mPrisma = {
    notification: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

// Mock logger
jest.mock('../utils/typeSafeLogger', () => ({
  info: jest.fn(),
  logUserAction: jest.fn(),
  logError: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('notificationService', () => {
  let prisma: any;

  beforeEach(() => {
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    test('returns notifications', async () => {
      const fakeNotifications = [{ id: 1 }, { id: 2 }];
      prisma.notification.findMany.mockResolvedValue(fakeNotifications);

      const result = await notificationService.getNotifications(1, { page: 1, limit: 2, unreadOnly: false });
      expect(result).toEqual(fakeNotifications);
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 2,
      });
    });

    test('filters unread notifications', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      await notificationService.getNotifications(1, { unreadOnly: true });
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 1, readAt: null } })
      );
    });

    test('throws app error if prisma fails', async () => {
      prisma.notification.findMany.mockRejectedValue(new Error('DB down'));
      await expect(notificationService.getNotifications(1, {})).rejects.toThrow();
    });
  });

  describe('markAsRead', () => {
    test('updates notification if found and user matches', async () => {
      const fakeNotification = { id: 1, userId: 1 };
      prisma.notification.findUnique.mockResolvedValue(fakeNotification);
      prisma.notification.update.mockResolvedValue({ ...fakeNotification, readAt: new Date() });

      const result = await notificationService.markAsRead(1, 1);
      expect(result).toHaveProperty('readAt');
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { 
            readAt: expect.any(Date),
            read: true
        },
      });
    });

    test('returns null if notification not found', async () => {
      prisma.notification.findUnique.mockResolvedValue(null);
      const result = await notificationService.markAsRead(999, 1);
      expect(result).toBeNull();
    });

    test('returns null if notification belongs to another user', async () => {
      prisma.notification.findUnique.mockResolvedValue({ id: 1, userId: 2 });
      const result = await notificationService.markAsRead(1, 1);
      expect(result).toBeNull();
    });

    test('throws app error if prisma update fails', async () => {
      prisma.notification.findUnique.mockResolvedValue({ id: 1, userId: 1 });
      prisma.notification.update.mockRejectedValue(new Error('DB error'));
      await expect(notificationService.markAsRead(1, 1)).rejects.toThrow();
    });
  });

  describe('markAllAsRead', () => {
    test('marks all unread notifications as read', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 3 });
      const result = await notificationService.markAllAsRead(1);
      expect(result).toBe(3);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 1, readAt: null },
        data: { 
            readAt: expect.any(Date),
            read: true
        },
      });
    });

    test('throws app error if updateMany fails', async () => {
      prisma.notification.updateMany.mockRejectedValue(new Error('DB error'));
      await expect(notificationService.markAllAsRead(1)).rejects.toThrow();
    });
  });

  describe('createNotification', () => {
    test('creates a notification', async () => {
      const fakeNotification = { id: 1, userId: 1, type: 'MESSAGE_RECEIVED', payload: {} };
      prisma.notification.create.mockResolvedValue(fakeNotification);

      const result = await notificationService.createNotification(1, 'MESSAGE_RECEIVED', {});
      expect(result).toEqual(fakeNotification);
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: { userId: 1, type: 'MESSAGE_RECEIVED', payload: {} },
      });
    });

    test('uses transaction client when provided', async () => {
      const fakeNotification = { id: 2, userId: 1, type: 'MESSAGE_RECEIVED', payload: {} };
      const tx = {
        notification: {
          create: jest.fn().mockResolvedValue(fakeNotification),
        },
      };

      const result = await notificationService.createNotification(1, 'MESSAGE_RECEIVED', {}, tx as any);

      expect(result).toEqual(fakeNotification);
      expect(tx.notification.create).toHaveBeenCalledWith({
        data: { userId: 1, type: 'MESSAGE_RECEIVED', payload: {} },
      });
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    test('throws app error if create fails', async () => {
      prisma.notification.create.mockRejectedValue(new Error('DB error'));
      await expect(notificationService.createNotification(1, 'MESSAGE_RECEIVED', {})).rejects.toThrow();
    });
  });

  describe('createNotifications', () => {
    test('creates notifications for unique users', async () => {
      const fakeNotifications = [
        { id: 1, userId: 1, type: 'MESSAGE_RECEIVED', payload: { eventId: 10 }, read: false, createdAt: new Date() },
        { id: 2, userId: 2, type: 'MESSAGE_RECEIVED', payload: { eventId: 10 }, read: false, createdAt: new Date() },
      ];
      
      prisma.notification.createMany.mockResolvedValue({ count: 2 });
      prisma.notification.findMany.mockResolvedValue(fakeNotifications);

      const result = await notificationService.createNotifications(
        [1, 2, 1],
        'MESSAGE_RECEIVED',
        { eventId: 10 }
      );

      expect(result).toBe(2);
      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: [
          { userId: 1, type: 'MESSAGE_RECEIVED', payload: { eventId: 10 } },
          { userId: 2, type: 'MESSAGE_RECEIVED', payload: { eventId: 10 } },
        ],
      });
      expect(prisma.notification.findMany).toHaveBeenCalled();
    });

    test('skips when user list is empty', async () => {
      const result = await notificationService.createNotifications([], 'MESSAGE_RECEIVED', {});
      expect(result).toBe(0);
      expect(prisma.notification.createMany).not.toHaveBeenCalled();
    });

    test('throws app error if createMany fails', async () => {
      prisma.notification.createMany.mockRejectedValue(new Error('DB error'));
      await expect(
        notificationService.createNotifications([1], 'MESSAGE_RECEIVED', {})
      ).rejects.toThrow();
    });
  });

  describe('Socket.io Integration', () => {
    let mockIO: any;

    beforeEach(() => {
      mockIO = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };
    });

    test('emits notification via Socket.io when creating single notification', async () => {
      // Import the init function
      const { initializeNotificationSocket } = require('../services/notificationService');
      initializeNotificationSocket(mockIO);

      const fakeNotification = {
        id: 1,
        userId: 123,
        type: 'MESSAGE_RECEIVED',
        payload: { messageId: 456, senderId: 789 },
        read: false,
        createdAt: new Date(),
      };
      prisma.notification.create.mockResolvedValue(fakeNotification);

      await notificationService.createNotification(123, 'MESSAGE_RECEIVED', {
        messageId: 456,
        senderId: 789,
      });

      expect(mockIO.to).toHaveBeenCalledWith('user:123');
      expect(mockIO.emit).toHaveBeenCalledWith('notification', expect.objectContaining({
        id: 1,
        type: 'MESSAGE_RECEIVED',
        read: false,
      }));
    });

    test('emits notifications via Socket.io when creating bulk notifications', async () => {
      const { initializeNotificationSocket } = require('../services/notificationService');
      initializeNotificationSocket(mockIO);

      const fakeNotifications = [
        { id: 10, userId: 123, type: 'EVENT_CREATED', payload: { eventId: 789, eventName: 'Park Walk' }, read: false, createdAt: new Date() },
        { id: 11, userId: 456, type: 'EVENT_CREATED', payload: { eventId: 789, eventName: 'Park Walk' }, read: false, createdAt: new Date() },
      ];

      prisma.notification.createMany.mockResolvedValue({ count: 2 });
      prisma.notification.findMany.mockResolvedValue(fakeNotifications);

      await notificationService.createNotifications([123, 456], 'EVENT_CREATED', {
        eventId: 789,
        eventName: 'Park Walk',
      });

      expect(mockIO.to).toHaveBeenCalledWith('user:123');
      expect(mockIO.to).toHaveBeenCalledWith('user:456');
      expect(mockIO.emit).toHaveBeenCalledTimes(2);
      expect(mockIO.emit).toHaveBeenCalledWith('notification', expect.objectContaining({ id: 10 }));
      expect(mockIO.emit).toHaveBeenCalledWith('notification', expect.objectContaining({ id: 11 }));
    });

    test('handles Socket.io not initialized gracefully', async () => {
      // Call without initializing Socket.io
      const fakeNotification = {
        id: 1,
        userId: 123,
        type: 'MESSAGE_RECEIVED',
        payload: {},
        read: false,
        createdAt: new Date(),
      };
      prisma.notification.create.mockResolvedValue(fakeNotification);

      // Should not throw even if Socket.io is null
      const result = await notificationService.createNotification(123, 'MESSAGE_RECEIVED', {});
      expect(result).toEqual(fakeNotification);
    });
  });
});

