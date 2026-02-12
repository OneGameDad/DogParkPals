import { expect, describe, test, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import messageController from '../controllers/messageController';
import messageService from '../services/messageService';
import typeSafeLogger from '../utils/typeSafeLogger';
import { parseValidation } from '../utils/validator';
import { awardExperience, awardSirBarksALotIfEligible, XP_REWARDS } from '../services/xpService';


jest.mock('../services/messageService', () => ({
  __esModule: true,
  default: {
    sendMessage: jest.fn(),
    getConversation: jest.fn(),
    getAllMessages: jest.fn(),
    updateStatus: jest.fn(),
    deleteMessage: jest.fn(),
    getUnreadMessages: jest.fn(),
    getUnreadCount: jest.fn(),
  },
}));

jest.mock('../utils/typeSafeLogger', () => ({
  logRequest: jest.fn(),
  logUserAction: jest.fn(),
}));

jest.mock('../utils/validator', () => ({
  parseValidation: jest.fn(),
}));

jest.mock('../services/xpService', () => ({
  awardExperience: jest.fn(),
  awardSirBarksALotIfEligible: jest.fn(),
  XP_REWARDS: {
    MESSAGE_FRIEND: 5,
  },
}));

jest.mock('../utils/errors', () => ({
  toAppError: jest.fn((err) => err),
  isAppError: jest.fn((err) => err instanceof Error && (err as any).statusCode !== undefined),
}));

describe('messageController', () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson, send: mockJson });
    mockReq = { body: {}, params: {}, query: {}, user: { id: 1 } };
    mockRes = { status: mockStatus, json: mockJson, send: mockJson } as Partial<Response> as Response;
    mockNext = jest.fn() as unknown as jest.MockedFunction<NextFunction>;
  });

  describe('sendMessage', () => {
    test('sends a message successfully', async () => {
      const mockMessage = { id: 1, senderId: 1, receiverId: 2, content: 'Hello' };
      (parseValidation as jest.Mock).mockReturnValue({ senderId: 1, receiverId: 2, content: 'Hello' });
      (messageService.sendMessage as jest.Mock).mockResolvedValue(mockMessage);

      await messageController.sendMessage(mockReq as Request, mockRes as Response, mockNext);

      expect(parseValidation).toHaveBeenCalled();
      expect(messageService.sendMessage).toHaveBeenCalledWith(1, 2, 'Hello');
      expect(typeSafeLogger.logRequest).toHaveBeenCalled();
      expect(typeSafeLogger.logUserAction).toHaveBeenCalledWith('Message sent', { senderId: 1, receiverId: 2, messageId: 1 });
      expect(awardExperience).toHaveBeenCalledWith(1, XP_REWARDS.MESSAGE_FRIEND, 'message_friend');
      expect(awardSirBarksALotIfEligible).toHaveBeenCalledWith(1);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(mockMessage);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('forwards validation error', async () => {
      const validationError = new Error('Validation failed');
      (parseValidation as jest.Mock).mockImplementation(() => { throw validationError; });

      await messageController.sendMessage(mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  describe('getConversation', () => {
    test('fetches conversation successfully', async () => {
      const mockConversation = [{ id: 1, content: 'Hi' }];
      (messageService.getConversation as jest.Mock).mockResolvedValue(mockConversation);
      mockReq.params.friendId = '2';

      await messageController.getConversation(mockReq as Request, mockRes as Response, mockNext);

      expect(messageService.getConversation).toHaveBeenCalledWith(1, 2);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockConversation);
    });

    test('forwards error on failure', async () => {
      const error = new Error('DB failure');
      (messageService.getConversation as jest.Mock).mockRejectedValue(error);
      mockReq.params.friendId = '2';

      await messageController.getConversation(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockStatus).not.toHaveBeenCalled();
    });
  });

  describe('getAllMessages', () => {
    test('fetches all messages successfully', async () => {
      const messages = [{ id: 1, content: 'Hi' }];
      (messageService.getAllMessages as jest.Mock).mockResolvedValue(messages);

      await messageController.getAllMessages(mockReq as Request, mockRes as Response, mockNext);

      expect(messageService.getAllMessages).toHaveBeenCalledWith(1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(messages);
    });

    test('forwards error', async () => {
      const error = new Error('DB failure');
      (messageService.getAllMessages as jest.Mock).mockRejectedValue(error);

      await messageController.getAllMessages(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateStatus', () => {
    test('updates message status successfully', async () => {
      const updatedMessage = { id: 1, status: 'READ' };
      mockReq.params.messageId = '1';
      mockReq.body = { status: 'READ' };
      (parseValidation as jest.Mock).mockReturnValue({ status: 'READ' });
      (messageService.updateStatus as jest.Mock).mockResolvedValue(updatedMessage);

      await messageController.updateStatus(mockReq as Request, mockRes as Response, mockNext);

      expect(messageService.updateStatus).toHaveBeenCalledWith(1, 'READ');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(updatedMessage);
    });

    test('forwards validation error', async () => {
      const error = new Error('Validation failed');
      (parseValidation as jest.Mock).mockImplementation(() => { throw error; });

      await messageController.updateStatus(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteMessage', () => {
    test('deletes message successfully', async () => {
      mockReq.params.messageId = '1';
      (messageService.deleteMessage as jest.Mock).mockResolvedValue(undefined);

      await messageController.deleteMessage(mockReq as Request, mockRes as Response, mockNext);

      expect(messageService.deleteMessage).toHaveBeenCalledWith(1);
      expect(mockStatus).toHaveBeenCalledWith(204);
    });

    test('forwards error', async () => {
      const error = new Error('DB failure');
      (messageService.deleteMessage as jest.Mock).mockRejectedValue(error);
      mockReq.params.messageId = '1';

      await messageController.deleteMessage(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getUnreadMessages', () => {
    test('fetches unread messages successfully', async () => {
      const messages = [{ id: 1, content: 'Hi' }];
      (messageService.getUnreadMessages as jest.Mock).mockResolvedValue(messages);

      await messageController.getUnreadMessages(mockReq as Request, mockRes as Response, mockNext);

      expect(messageService.getUnreadMessages).toHaveBeenCalledWith(1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(messages);
    });

    test('forwards error', async () => {
      const error = new Error('DB failure');
      (messageService.getUnreadMessages as jest.Mock).mockRejectedValue(error);

      await messageController.getUnreadMessages(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getUnreadCount', () => {
    test('fetches unread count successfully', async () => {
      (messageService.getUnreadCount as jest.Mock).mockResolvedValue(5);

      await messageController.getUnreadCount(mockReq as Request, mockRes as Response, mockNext);

      expect(messageService.getUnreadCount).toHaveBeenCalledWith(1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ count: 5 });
    });

    test('forwards error', async () => {
      const error = new Error('DB failure');
      (messageService.getUnreadCount as jest.Mock).mockRejectedValue(error);

      await messageController.getUnreadCount(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
