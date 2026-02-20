import messageService from "../services/messageService";
import express from "express";
import typeSafeLogger from "../utils/typeSafeLogger";
import { ensureString } from "../utils/queryHelpers";
import { toAppError, isAppError } from "../utils/errors";
import { parseValidation } from "../utils/validator";
import { sendMessageSchema, updateMessageStatusSchema, paginationQuerySchema, cursorPaginationQuerySchema } from "../utils/validationSchemas";
import { awardExperience, awardSirBarksALotIfEligible, XP_REWARDS } from "../services/xpService";
import { buildPaginatedResponse, buildCursorPaginatedResponse } from "../utils/response";


const messageController = {
    sendMessage: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to send message", {method: req.method, path: req.path});
            const { senderId, receiverId, content } = parseValidation(sendMessageSchema, req.body);
            const message = await messageService.sendMessage(senderId, receiverId, content);
            typeSafeLogger.logUserAction("Message sent", { senderId, receiverId, messageId: message.id });
            await awardExperience(senderId, XP_REWARDS.MESSAGE_FRIEND, 'message_friend');
            await awardSirBarksALotIfEligible(senderId);
             res.status(201).json(message);
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(toAppError(error, { message: "Failed to send message", code: "INTERNAL_ERROR", statusCode: 500 }));
        }
    },

    getConversation: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to fetch conversation", { method: req.method, path: req.path });
            const userId = (req as any).user?.id;
            const friendId = parseInt(ensureString(req.params.friendId), 10);
            
            const { page = 1, limit = 50 } = parseValidation(paginationQuerySchema, req.query);

            const { messages, total } = await messageService.getConversation(userId, friendId, page, limit);

            typeSafeLogger.logUserAction("Conversation retrieved", { userId, friendId, messageCount: messages.length, page, limit, total });
            res.status(200).json(buildPaginatedResponse(messages, page, limit, total));
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(toAppError(error, { message: "Failed to retrieve conversation", code: "INTERNAL_ERROR", statusCode: 500 }));
        }
    },

    getAllMessages: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to fetch all messages", { method: req.method, path: req.path });
            const userId = (req as any).user?.id;
            
            const { page = 1, limit = 50 } = parseValidation(paginationQuerySchema, req.query);

            const { messages, total } = await messageService.getAllMessages(userId, page, limit);

            typeSafeLogger.logUserAction("All messages retrieved", { userId, messageCount: messages.length, page, limit, total });
            res.status(200).json(buildPaginatedResponse(messages, page, limit, total));
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(toAppError(error, { message: "Failed to fetch messages", code: "INTERNAL_ERROR", statusCode: 500 }));
        }
    },

    updateStatus: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to update message status", { method: req.method, path: req.path });
            const messageId = parseInt(ensureString(req.params.messageId), 10);
            const { status } = parseValidation(updateMessageStatusSchema, req.body);

            const updatedMessage = await messageService.updateStatus(messageId, status);

            typeSafeLogger.logUserAction("Message status updated", { messageId, status });
            res.status(200).json(updatedMessage);
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(toAppError(error, { message: "Failed to update message status", code: "INTERNAL_ERROR", statusCode: 500 }));
        }
    },

    deleteMessage: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to delete message", { method: req.method, path: req.path });
            const messageId = parseInt(ensureString(req.params.messageId), 10);

            await messageService.deleteMessage(messageId);

            typeSafeLogger.logUserAction("Message deleted", { messageId });
            res.status(204).send();
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(toAppError(error, { message: "Failed to delete message", code: "INTERNAL_ERROR", statusCode: 500 }));
        }
    },

    getUnreadMessages: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const userId = (req as any).user?.id;
        const { page = 1, limit = 50 } = parseValidation(paginationQuerySchema, req.query);

        const { messages, total } = await messageService.getUnreadMessages(userId, page, limit);
        
        typeSafeLogger.logUserAction('Unread messages retrieved', { userId, count: messages.length, page, limit, total });
        res.status(200).json(buildPaginatedResponse(messages, page, limit, total));
      } catch (error) {
        if (isAppError(error)) {
            return next(error);
        }
        return next(toAppError(error, { message: 'Failed to fetch unread messages', code: 'INTERNAL_ERROR', statusCode: 500 }));
      }
    },

    getUnreadCount: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const userId = (req as any).user?.id;
        const count = await messageService.getUnreadCount(userId);
        typeSafeLogger.logUserAction('Unread message count retrieved', { userId, count });
        res.status(200).json({ count });
      } catch (error) {
        if (isAppError(error)) {
            return next(error);
        }
        return next(toAppError(error, { message: 'Failed to fetch unread message count', code: 'INTERNAL_ERROR', statusCode: 500 }));
      }
    },

    // Cursor-based pagination endpoints for real-time chat
    getConversationCursor: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to fetch conversation (cursor)", { method: req.method, path: req.path });
            const userId = (req as any).user?.id;
            const friendId = parseInt(ensureString(req.params.friendId), 10);
            
            const { lastMessageId, limit = 50 } = parseValidation(cursorPaginationQuerySchema, req.query);

            const { messages, hasMore } = await messageService.getConversationCursor(userId, friendId, lastMessageId, limit);

            typeSafeLogger.logUserAction("Conversation retrieved (cursor)", { userId, friendId, messageCount: messages.length, lastMessageId, hasMore });
            res.status(200).json(buildCursorPaginatedResponse(messages, limit, hasMore));
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(toAppError(error, { message: "Failed to retrieve conversation", code: "INTERNAL_ERROR", statusCode: 500 }));
        }
    },

    getAllMessagesCursor: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to fetch all messages (cursor)", { method: req.method, path: req.path });
            const userId = (req as any).user?.id;
            
            const { lastMessageId, limit = 50 } = parseValidation(cursorPaginationQuerySchema, req.query);

            const { messages, hasMore } = await messageService.getAllMessagesCursor(userId, lastMessageId, limit);

            typeSafeLogger.logUserAction("All messages retrieved (cursor)", { userId, messageCount: messages.length, lastMessageId, hasMore });
            res.status(200).json(buildCursorPaginatedResponse(messages, limit, hasMore));
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(toAppError(error, { message: "Failed to fetch messages", code: "INTERNAL_ERROR", statusCode: 500 }));
        }
    },

    getUnreadMessagesCursor: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const userId = (req as any).user?.id;
        const { lastMessageId, limit = 50 } = parseValidation(cursorPaginationQuerySchema, req.query);

        const { messages, hasMore } = await messageService.getUnreadMessagesCursor(userId, lastMessageId, limit);
        
        typeSafeLogger.logUserAction('Unread messages retrieved (cursor)', { userId, count: messages.length, lastMessageId, hasMore });
        res.status(200).json(buildCursorPaginatedResponse(messages, limit, hasMore));
      } catch (error) {
        if (isAppError(error)) {
            return next(error);
        }
        return next(toAppError(error, { message: 'Failed to fetch unread messages', code: 'INTERNAL_ERROR', statusCode: 500 }));
      }
    },
};

export default messageController;