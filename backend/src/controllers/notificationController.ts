import express from "express";
import typeSafeLogger from "../utils/typeSafeLogger";
import { NotFoundError, ForbiddenError, toAppError } from "../utils/errors";
import { parseValidation } from "../utils/validator";
import notificationService from "../services/notificationService";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      user?: {
        id: number;
        role?: string;
      };
    }
  }
}

const notificationController = {
  getNotifications: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to get notifications", { method: req.method, path: req.path });
      const userId = req.userId;
      if (!userId) {
        throw ForbiddenError("User not authenticated");
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const unreadOnly = req.query.unreadOnly === 'true';

      const notifications = await notificationService.getNotifications(userId, {
        page,
        limit, 
        unreadOnly,
      });
      typeSafeLogger.logUserAction("Notifications retrieved", { userId, count: notifications.length });
      res.status(200).json({ notifications });
    } catch (error) {
        return next(
            toAppError(error, { message: "Failed to get notifications", code: "INTERNAL_ERROR", statusCode: 500 }));
      }
    },

  markAsRead: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to mark notification as read", { method: req.method, path: req.path });

      const userId = req.userId;
      if (!userId) {
        throw ForbiddenError("User not authenticated");
      }

      const notificationId = parseInt(req.params.id, 10);
      const updatedNotification = await notificationService.markAsRead(notificationId, userId);

      if (!updatedNotification) {
      // Notification not found
        return res.status(404).json({ message: "Notification not found" });
      }

      typeSafeLogger.logUserAction("Notification marked as read", { notificationId, userId });
      res.status(200).json(updatedNotification);
    } catch (error) {
      return next(
        toAppError(error, { message: "Failed to mark notification as read", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
},

    markAllAsRead: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        typeSafeLogger.logRequest("Received request to mark all notifications as read", { method: req.method, path: req.path });
        const userId = req.userId;
        if (!userId) {
          throw ForbiddenError("User not authenticated");
        }

        await notificationService.markAllAsRead(userId);
        typeSafeLogger.logUserAction("All notifications marked as read", { userId });
        res.status(200).json({ message: "All notifications marked as read" });
      } catch (error) {
          return next(
              toAppError(error, { message: "Failed to mark all notifications as read", code: "INTERNAL_ERROR", statusCode: 500 }));
        }
    },
};

export default notificationController;