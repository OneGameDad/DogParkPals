import { NotificationType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import notificationService from '../../services/notificationService';

export async function handleMessageSentNotifications(event: DomainEventUnion) {
  if (event.type !== EventTypes.MessageSent) return;

  const { messageId, senderId, receiverId } = event.payload;

  await notificationService.createNotification(receiverId, NotificationType.MESSAGE_RECEIVED, {
    messageId,
    senderId,
  });
}
