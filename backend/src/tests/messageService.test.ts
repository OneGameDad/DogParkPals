import { expect, describe, test, beforeEach, jest } from '@jest/globals';
import type { Messages, MessageStatus } from '@prisma/client';

describe('Message Service', () => {
  const mockSenderId = 1;
  const mockReceiverId = 2;
  const mockMessageId = 1;
  const mockContent = 'Hello!';
  const mockPage = 1;
  const mockLimit = 50;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('sendMessage', () => {
    test('should successfully send a message', async () => {
      const mockMessage: Messages = {
        id: mockMessageId,
        senderId: mockSenderId,
        receiverId: mockReceiverId,
        content: mockContent,
        status: 'SENT',
        sentAt: new Date(),
      };

      const mockCreate = jest.fn().mockResolvedValue(mockMessage);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({ messages: { create: mockCreate } })),
      }));

      const messageService = await import('../services/messageService');

      const result = await messageService.default.sendMessage(mockSenderId, mockReceiverId, mockContent);

      expect(result).toEqual(mockMessage);
      expect(mockCreate).toHaveBeenCalledWith({
        data: { senderId: mockSenderId, receiverId: mockReceiverId, content: mockContent, status: 'SENT' },
      });

      jest.dontMock('@prisma/client');
    });

    test('should throw error when database operation fails', async () => {
      const mockCreate = jest.fn().mockRejectedValue(new Error('Database error'));

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({ messages: { create: mockCreate } })),
      }));

      const messageService = await import('../services/messageService');

      await expect(
        messageService.default.sendMessage(mockSenderId, mockReceiverId, mockContent)
      ).rejects.toThrow();

      jest.dontMock('@prisma/client');
    });
  });

  describe('getConversation', () => {
    test('should fetch conversation between two users', async () => {
      const mockMessages: Messages[] = [
        { id: 1, senderId: mockSenderId, receiverId: mockReceiverId, content: 'Hi', status: 'SENT', sentAt: new Date() },
      ];
      const mockFindMany = jest.fn().mockResolvedValue(mockMessages);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({ messages: { findMany: mockFindMany } })),
      }));

      const messageService = await import('../services/messageService');

      const result = await messageService.default.getConversation(mockSenderId, mockReceiverId);

      expect(result).toEqual(mockMessages);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { senderId: mockSenderId, receiverId: mockReceiverId },
            { senderId: mockReceiverId, receiverId: mockSenderId },
          ],
        },
        orderBy: { sentAt: 'asc' },
        skip: 0,
        take: 50,
      });

      jest.dontMock('@prisma/client');
    });

    test('should apply status filter if provided', async () => {
      const mockMessages: Messages[] = [];
      const mockFindMany = jest.fn().mockResolvedValue(mockMessages);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({ messages: { findMany: mockFindMany } })),
      }));

      const messageService = await import('../services/messageService');

      await messageService.default.getConversation(mockSenderId, mockReceiverId, 1, 50, 'SENT');

      expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ status: 'SENT' }),
      }));

      jest.dontMock('@prisma/client');
    });

    test('should throw error when database operation fails', async () => {
      const mockFindMany = jest.fn().mockRejectedValue(new Error('Database error'));

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({ messages: { findMany: mockFindMany } })),
      }));

      const messageService = await import('../services/messageService');

      await expect(
        messageService.default.getConversation(mockSenderId, mockReceiverId)
      ).rejects.toThrow();

      jest.dontMock('@prisma/client');
    });
  });

  describe('updateStatus', () => {
    test('should successfully update message status', async () => {
      const mockUpdated: Messages = {
        id: mockMessageId,
        senderId: mockSenderId,
        receiverId: mockReceiverId,
        content: mockContent,
        status: 'READ',
        sentAt: new Date(),
      };

      const mockUpdate = jest.fn().mockResolvedValue(mockUpdated);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({ messages: { update: mockUpdate } })),
      }));

      const messageService = await import('../services/messageService');

      const result = await messageService.default.updateStatus(mockMessageId, 'READ');

      expect(result).toEqual(mockUpdated);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: mockMessageId },
        data: { status: 'READ' },
      });

      jest.dontMock('@prisma/client');
    });

    test('should throw error when database operation fails', async () => {
      const mockUpdate = jest.fn().mockRejectedValue(new Error('Database error'));

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({ messages: { update: mockUpdate } })),
      }));

      const messageService = await import('../services/messageService');

      await expect(
        messageService.default.updateStatus(mockMessageId, 'READ')
      ).rejects.toThrow();

      jest.dontMock('@prisma/client');
    });
  });

  describe('deleteMessage', () => {
    test('should successfully delete a message', async () => {
      const mockDelete = jest.fn().mockResolvedValue(undefined);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({ messages: { delete: mockDelete } })),
      }));

      const messageService = await import('../services/messageService');

      await messageService.default.deleteMessage(mockMessageId);

      expect(mockDelete).toHaveBeenCalledWith({ where: { id: mockMessageId } });

      jest.dontMock('@prisma/client');
    });

    test('should throw error when database operation fails', async () => {
      const mockDelete = jest.fn().mockRejectedValue(new Error('Database error'));

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({ messages: { delete: mockDelete } })),
      }));

      const messageService = await import('../services/messageService');

      await expect(
        messageService.default.deleteMessage(mockMessageId)
      ).rejects.toThrow();

      jest.dontMock('@prisma/client');
    });
  });

  describe('getUnreadMessages & getUnreadCount', () => {
    test('should fetch unread messages', async () => {
      const mockMessages: Messages[] = [{ id: 1, senderId: mockSenderId, receiverId: mockReceiverId, content: 'Hi', status: 'SENT', sentAt: new Date() }];
      const mockFindMany = jest.fn().mockResolvedValue(mockMessages);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({ messages: { findMany: mockFindMany } })),
      }));

      const messageService = await import('../services/messageService');

      const result = await messageService.default.getUnreadMessages(mockReceiverId);

      expect(result).toEqual(mockMessages);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { receiverId: mockReceiverId, status: 'SENT' },
        orderBy: { sentAt: 'asc' },
      });

      jest.dontMock('@prisma/client');
    });

    test('should fetch unread message count', async () => {
      const mockCount = 5;
      const mockCountFn = jest.fn().mockResolvedValue(mockCount);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({ messages: { count: mockCountFn } })),
      }));

      const messageService = await import('../services/messageService');

      const count = await messageService.default.getUnreadCount(mockReceiverId);

      expect(count).toBe(mockCount);
      expect(mockCountFn).toHaveBeenCalledWith({ where: { receiverId: mockReceiverId, status: 'SENT' } });

      jest.dontMock('@prisma/client');
    });
  });
});
