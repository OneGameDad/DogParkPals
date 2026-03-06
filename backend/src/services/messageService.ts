import { PrismaClient, MessageStatus } from '@prisma/client';
import typeSafeLogger from '../utils/typeSafeLogger';
import { toAppError } from '../utils/errors';
import { createDomainEvent } from '../events/createDomainEvent';
import { EventTypes } from '../events/eventTypes';
import { addOutboxEvent } from '../infrastructure/outbox/outboxRepository';
import { Server as SocketServer } from 'socket.io';

const prisma = new PrismaClient();

// Socket.io instance for real-time messaging
let io: SocketServer | null = null;

export function initializeMessageSocket(socketIo: SocketServer) {
  io = socketIo;
  typeSafeLogger.info('MessageService initialized with Socket.io');
}

const messageService = {
  async sendMessage(senderId: number, receiverId: number, content: string) {
    typeSafeLogger.logUserAction('Sending message', { senderId, receiverId });
    try {
      const message = await prisma.$transaction(async (tx) => {
        const createdMessage = await tx.messages.create({
          data: { senderId, receiverId, content, status: 'SENT' },
        });

        const domainEvent = createDomainEvent(
          EventTypes.MessageSent,
          {
            messageId: createdMessage.id,
            senderId: createdMessage.senderId,
            receiverId: createdMessage.receiverId,
          },
          { actorId: createdMessage.senderId }
        );
        await addOutboxEvent(tx, domainEvent);

        return createdMessage;
      });

      // Emit message via Socket.io for real-time delivery
      if (io) {
        io.to(`user:${receiverId}`).emit('message:new', message);
        typeSafeLogger.debug('Message emitted via Socket.io', {
          messageId: message.id,
          senderId,
          receiverId,
        });
      }

      return message;
    } catch (error) {
      throw toAppError(error, { message: 'Failed to send message', code: 'SEND_MESSAGE_FAILED' });
    }
  },

  async getConversation(
      userId: number,
      friendId: number,
      page: number = 1,
      limit: number = 50, // for pagination
      status?: MessageStatus // optional filtering by message status
  ) {
    try {
      const where: any = {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      };

      if (status) where.status = status;

      const [messages, total] = await Promise.all([
        prisma.messages.findMany({
          where,
          orderBy: { sentAt: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.messages.count({ where }),
      ]);

      return { messages, total };
    } catch (error) {
      throw toAppError(error, { message: 'Failed to fetch conversation', code: 'FETCH_CONVERSATION_FAILED' });
    }
  },

  async getAllMessages(
    userId: number,
    page: number = 1,
    limit: number = 50,
    status?: MessageStatus
  ) {
    try {
      const where: any = { receiverId: userId };
      if (status) where.status = status;

      const [messages, total] = await Promise.all([
        prisma.messages.findMany({
          where,
          orderBy: { sentAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.messages.count({ where }),
      ]);

      return { messages, total };
    } catch (error) {
      throw toAppError(error, { message: 'Failed to fetch messages', code: 'FETCH_MESSAGES_FAILED' });
    }
  },

  async updateStatus(messageId: number, status: MessageStatus) {
    try {
      const updated = await prisma.messages.update({
        where: { id: messageId },
        data: { status },
      });

      // Emit status update via Socket.io
      if (io && updated) {
        io.to(`user:${updated.senderId}`).emit('message:status', {
          messageId: updated.id,
          status: updated.status,
        });
        typeSafeLogger.debug('Message status emitted via Socket.io', {
          messageId: updated.id,
          status: updated.status,
        });
      }

      return updated;
    } catch (error) {
      throw toAppError(error, { message: 'Failed to update message status', code: 'UPDATE_MESSAGE_FAILED' });
    }
  },

  async deleteMessage(messageId: number) {
    try {
      await prisma.messages.delete({ where: { id: messageId } });
    } catch (error) {
      throw toAppError(error, { message: 'Failed to delete message', code: 'DELETE_MESSAGE_FAILED' });
    }
  },

  async getUnreadMessages(
    userId: number,
    page: number = 1,
    limit: number = 50
  ) {
    try {
      const where = { receiverId: userId, status: 'SENT' as MessageStatus };

      const [messages, total] = await Promise.all([
        prisma.messages.findMany({
          where,
          orderBy: { sentAt: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.messages.count({ where }),
      ]);

      return { messages, total };
    } catch (error) {
      throw toAppError(error, {
        message: 'Failed to fetch unread messages',
        code: 'FETCH_UNREAD_MESSAGES_FAILED',
      });
    }
  },

  async getUnreadCount(userId: number) {
    try {
      const count = await prisma.messages.count({
        where: { receiverId: userId, status: 'SENT' },
      });
      return count;
    } catch (error) {
      throw toAppError(error, {
        message: 'Failed to fetch unread message count',
        code: 'FETCH_UNREAD_COUNT_FAILED',
      });
    }
  },

  // Cursor-based pagination methods for real-time chat (better for infinite scroll)
  async getConversationCursor(
    userId: number,
    friendId: number,
    lastMessageId?: number,
    limit: number = 50,
    status?: MessageStatus
  ) {
    try {
      const where: any = {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      };

      if (status) where.status = status;
      if (lastMessageId) where.id = { lt: lastMessageId };

      const messages = await prisma.messages.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        take: limit + 1, // fetch one extra to determine hasMore
      });

      const hasMore = messages.length > limit;
      const data = hasMore ? messages.slice(0, limit) : messages;

      return { messages: data, hasMore };
    } catch (error) {
      throw toAppError(error, { message: 'Failed to fetch conversation', code: 'FETCH_CONVERSATION_FAILED' });
    }
  },

  async getAllMessagesCursor(
    userId: number,
    lastMessageId?: number,
    limit: number = 50,
    status?: MessageStatus
  ) {
    try {
      const where: any = { receiverId: userId };
      if (status) where.status = status;
      if (lastMessageId) where.id = { lt: lastMessageId };

      const messages = await prisma.messages.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        take: limit + 1, // fetch one extra to determine hasMore
      });

      const hasMore = messages.length > limit;
      const data = hasMore ? messages.slice(0, limit) : messages;

      return { messages: data, hasMore };
    } catch (error) {
      throw toAppError(error, { message: 'Failed to fetch messages', code: 'FETCH_MESSAGES_FAILED' });
    }
  },

  async getUnreadMessagesCursor(
    userId: number,
    lastMessageId?: number,
    limit: number = 50
  ) {
    try {
      const where: any = { receiverId: userId, status: 'SENT' as MessageStatus };
      if (lastMessageId) where.id = { lt: lastMessageId };

      const messages = await prisma.messages.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        take: limit + 1, // fetch one extra to determine hasMore
      });

      const hasMore = messages.length > limit;
      const data = hasMore ? messages.slice(0, limit) : messages;

      return { messages: data.reverse(), hasMore }; // reverse to get ascending order
    } catch (error) {
      throw toAppError(error, {
        message: 'Failed to fetch unread messages',
        code: 'FETCH_UNREAD_MESSAGES_FAILED',
      });
    }
  }
};

export default messageService;