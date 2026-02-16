import { PrismaClient, Prisma, NotificationType } from "@prisma/client";
import typeSafeLogger from "../utils/typeSafeLogger";
import { toAppError } from "../utils/errors";

const prisma = new PrismaClient();

type PrismaClientOrTx = PrismaClient | Prisma.TransactionClient;

function getClient(tx?: PrismaClientOrTx) {
  return tx ?? prisma;
}

const notificationService = {
    async getNotifications(
        userId: number,
        options: {
            page?: number;
            limit?: number;
            unreadOnly?: boolean;
        }
    ) {
        const {
        page = 1,
        limit = 20,
        unreadOnly = false,
        } = options;

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
            data: {
              readAt: new Date(), 
              read: true
            },
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
            data: { 
              readAt: new Date(),
              read: true
            },
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
        payload: object,
        tx?: PrismaClientOrTx
      ) {
        try {
            const client = getClient(tx);
            return await client.notification.create({
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
      },

      async createNotifications(
      userIds: number[],
      type: NotificationType,
      payload: object
    ) {
      try {
        const uniqueIds = Array.from(new Set(userIds)).filter((id) => Number.isFinite(id));
        if (uniqueIds.length === 0) {
          return 0;
        }
        await prisma.notification.createMany({
          data: uniqueIds.map((userId) => ({
            userId,
            type,
            payload,
          })),
        });
        return uniqueIds.length;
      } catch (error) {
        const appError = toAppError(error, {
          message: "Failed to create notifications",
          code: "CREATE_NOTIFICATIONS_FAILED",
        });
        typeSafeLogger.logError("Error creating notifications", appError, { count: userIds.length, type });
        throw appError;
      }
    },
};

export default notificationService;