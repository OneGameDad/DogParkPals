import { PrismaClient, NotificationType } from "@prisma/client";
import typeSafeLogger from "../utils/typeSafeLogger";
import { toAppError } from "../utils/errors";

const prisma = new PrismaClient();

const notificationService = {
    async getNotifications(
        userId: number,
        page = 1,
        limit = 20,
        unreadOnly = false
    ) {
      typeSafeLogger.info("Fetching notifications", { userId, page, limit, unreadOnly });
      try {
        const skip = (page - 1) * limit;
        const notifications = await prisma.notification.findMany({
          where: {
            userId,
            ...(unreadOnly ? { readAt: null } : {}),
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        });
        typeSafeLogger.logUserAction("Notifications fetched", { userId, count: notifications.length });
        return notifications;
      } catch (error) {
        const appError = toAppError(error, {
          message: "Failed to fetch notifications",
          code: "FETCH_NOTIFICATIONS_FAILED",
        });
        typeSafeLogger.logError("Error fetching notifications", appError, { userId });
        throw appError;
      }
    },

    async markAsRead(notificationId: number, userId: number) {
        typeSafeLogger.logUserAction("Marking notification as read", { notificationId, userId });
        try {
          const notification = await prisma.notification.findUnique({
            where: { id: notificationId },
          });
          if (!notification || notification.userId !== userId) {
            return null;
          }
          return await prisma.notification.update({
            where: { id: notificationId },
            data: { readAt: new Date() },
          });
        } catch (error) {
          const appError = toAppError(error, {
            message: "Failed to mark notification as read",
            code: "MARK_NOTIFICATION_AS_READ_FAILED",
          });
          typeSafeLogger.logError("Error marking notification as read", appError, { notificationId, userId });
          throw appError;
        }
      },

    async markAllAsRead(userId: number) {
        typeSafeLogger.logUserAction("Marking all notifications as read", { userId });
        try {
          const result = await prisma.notification.updateMany({
            where: { userId, readAt: null },
            data: { readAt: new Date() },
          });
          return result.count;
        } catch (error) {
          const appError = toAppError(error, {
            message: "Failed to mark all notifications as read",
            code: "MARK_ALL_NOTIFICATIONS_AS_READ_FAILED",
          });
          typeSafeLogger.logError("Error marking all notifications as read", appError, { userId });
          throw appError;
        }
      },

      async createNotification(
        userId: number,
        type: NotificationType,
        payload: object
      ) {
        try {
            return await prisma.notification.create({
                data: {
                    userId,
                    type,
                    payload,
                },
            });
        } catch (error) {
            const appError = toAppError(error, {
                message: "Failed to create notification",
                code: "CREATE_NOTIFICATION_FAILED",
            });
            typeSafeLogger.logError("Error creating notification", appError, { userId, type });
            throw appError;
        }
      }
};

export default notificationService;