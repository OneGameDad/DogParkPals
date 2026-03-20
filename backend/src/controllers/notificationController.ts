import express from "express";
import typeSafeLogger from "../utils/typeSafeLogger";
import { ForbiddenError, toAppError, isAppError } from "../utils/errors";
import notificationService from "../services/notificationService";
import { getQueryNumber, getQueryBoolean, ensureString } from "../utils/queryHelpers";

const notificationController = {
  getNotifications: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to get notifications", { method: req.method, path: req.path });
      const userId = req.userId;
      if (!userId) {
        throw ForbiddenError("User not authenticated");
      }

      const page = getQueryNumber(req.query.page) || 1;
      const limit = getQueryNumber(req.query.limit) || 20;
      const unreadOnly = getQueryBoolean(req.query.unreadOnly) || false;

      const notifications = await notificationService.getNotifications(userId, {
        page,
        limit, 
        unreadOnly,
      });
      typeSafeLogger.logUserAction("Notifications retrieved", { userId, count: notifications.length });
      res.status(200).json({ notifications });
    } catch (error) {
        if (isAppError(error)) {
            return next(error);
        }
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

      const notificationId = parseInt(ensureString(req.params.id), 10);
      const updatedNotification = await notificationService.markAsRead(notificationId, userId);

      if (!updatedNotification) {
      // Notification not found
        return res.status(404).json({ message: "Notification not found" });
      }

      typeSafeLogger.logUserAction("Notification marked as read", { notificationId, userId });
      res.status(200).json(updatedNotification);
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
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
          if (isAppError(error)) {
              return next(error);
          }
          return next(
              toAppError(error, { message: "Failed to mark all notifications as read", code: "INTERNAL_ERROR", statusCode: 500 }));
        }
    },
};

export default notificationController;