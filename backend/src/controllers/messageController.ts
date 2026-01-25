import messageService from "../services/messageService";
import express from "express";
import typeSafeLogger from "../utils/typeSafeLogger";
import { toAppError, isAppError } from "../utils/errors";
import { parseValidation } from "../utils/validator";
import { sendMessageSchema, updateMessageStatusSchema } from "../utils/validationSchemas";


const messageController = {
    sendMessage: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to send message", {method: req.method, path: req.path});
            const { senderId, receiverId, content } = parseValidation(sendMessageSchema, req.body);
            const message = await messageService.sendMessage(senderId, receiverId, content);
            typeSafeLogger.logUserAction("Message sent", { senderId, receiverId, messageId: message.id });
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
            const friendId = parseInt(req.params.friendId, 10);

            const conversation = await messageService.getConversation(userId, friendId);

            typeSafeLogger.logUserAction("Conversation retrieved", { userId, friendId, messageCount: conversation.length });
            res.status(200).json(conversation);
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

            const messages = await messageService.getAllMessages(userId);

            typeSafeLogger.logUserAction("All messages retrieved", { userId, messageCount: messages.length });
            res.status(200).json(messages);
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
            const messageId = parseInt(req.params.messageId, 10);
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
            const messageId = parseInt(req.params.messageId, 10);

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
        const messages = await messageService.getUnreadMessages(userId);
        typeSafeLogger.logUserAction('Unread messages retrieved', { userId, count: messages.length });
        res.status(200).json(messages);
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
};

export default messageController;