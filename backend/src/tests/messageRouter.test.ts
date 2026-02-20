import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import express from 'express';
import request from 'supertest';
import { MessageStatus } from '@prisma/client';

// Mock the auth middleware before importing the router
jest.mock('../middlewares/authMiddleware', () => ({
  requireAuth: (req: Request, res: Response, next: NextFunction) => {
    (req as any).userId = 1;
    next();
  },
}));

const sendMessageMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();
const getConversationMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();
const getAllMessagesMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();
const updateStatusMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();
const deleteMessageMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();
const getUnreadMessagesMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();
const getUnreadCountMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();
const getConversationCursorMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();
const getAllMessagesCursorMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();
const getUnreadMessagesCursorMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();

jest.mock('../controllers/messageController', () => ({
  __esModule: true,
  default: {
    sendMessage: sendMessageMock,
    getConversation: getConversationMock,
    getAllMessages: getAllMessagesMock,
    updateStatus: updateStatusMock,
    deleteMessage: deleteMessageMock,
    getUnreadMessages: getUnreadMessagesMock,
    getUnreadCount: getUnreadCountMock,
    getConversationCursor: getConversationCursorMock,
    getAllMessagesCursor: getAllMessagesCursorMock,
    getUnreadMessagesCursor: getUnreadMessagesCursorMock,
  },
}));

import messageRouter from '../routes/messageRouter';

const okHandler = (name: string) => (req: Request, res: Response) =>
  res.status(200).json({ handler: name, params: req.params, body: req.body, query: req.query });

const defaultHandlers = () => {
  sendMessageMock.mockImplementation(okHandler('sendMessage'));
  getConversationMock.mockImplementation(okHandler('getConversation'));
  getAllMessagesMock.mockImplementation(okHandler('getAllMessages'));
  updateStatusMock.mockImplementation(okHandler('updateStatus'));
  deleteMessageMock.mockImplementation(okHandler('deleteMessage'));
  getUnreadMessagesMock.mockImplementation(okHandler('getUnreadMessages'));
  getUnreadCountMock.mockImplementation(okHandler('getUnreadCount'));
  getConversationCursorMock.mockImplementation(okHandler('getConversationCursor'));
  getAllMessagesCursorMock.mockImplementation(okHandler('getAllMessagesCursor'));
  getUnreadMessagesCursorMock.mockImplementation(okHandler('getUnreadMessagesCursor'));
};

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(messageRouter);
  return app;
};

describe('messageRouter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    defaultHandlers();
  });

  test('POST /:friendId routes to sendMessage', async () => {
    const payload = { senderId: 1, receiverId: 2, content: 'Hello' };
    const response = await request(buildApp()).post('/2').send(payload);

    expect(response.status).toBe(200);
    expect(response.body.handler).toBe('sendMessage');
    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(sendMessageMock.mock.calls[0][0].body).toEqual(payload);
  });

  test('GET /:friendId routes to getConversation', async () => {
    const response = await request(buildApp()).get('/2');

    expect(response.status).toBe(200);
    expect(response.body.handler).toBe('getConversation');
    expect(getConversationMock).toHaveBeenCalledTimes(1);
    expect(getConversationMock.mock.calls[0][0].params.friendId).toBe('2');
  });

  test('GET / routes to getAllMessages', async () => {
    const response = await request(buildApp()).get('/');

    expect(response.status).toBe(200);
    expect(response.body.handler).toBe('getAllMessages');
    expect(getAllMessagesMock).toHaveBeenCalledTimes(1);
  });

  test('PATCH /:messageId/status routes to updateStatus', async () => {
    const payload = { status: MessageStatus.READ };
    const response = await request(buildApp()).patch('/5/status').send(payload);

    expect(response.status).toBe(200);
    expect(response.body.handler).toBe('updateStatus');
    expect(updateStatusMock).toHaveBeenCalledTimes(1);
    expect(updateStatusMock.mock.calls[0][0].body).toEqual(payload);
    expect(updateStatusMock.mock.calls[0][0].params.messageId).toBe('5');
  });

  test('DELETE /:messageId routes to deleteMessage', async () => {
    const response = await request(buildApp()).delete('/5');

    expect(response.status).toBe(200);
    expect(response.body.handler).toBe('deleteMessage');
    expect(deleteMessageMock).toHaveBeenCalledTimes(1);
    expect(deleteMessageMock.mock.calls[0][0].params.messageId).toBe('5');
  });

  test('GET /unread routes to getUnreadMessages', async () => {
    const response = await request(buildApp()).get('/unread');

    expect(response.status).toBe(200);
    expect(response.body.handler).toBe('getUnreadMessages');
    expect(getUnreadMessagesMock).toHaveBeenCalledTimes(1);
  });

  test('GET /unread/count routes to getUnreadCount', async () => {
    const response = await request(buildApp()).get('/unread/count');

    expect(response.status).toBe(200);
    expect(response.body.handler).toBe('getUnreadCount');
    expect(getUnreadCountMock).toHaveBeenCalledTimes(1);
  });
});