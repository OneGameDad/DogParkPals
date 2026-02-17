import { NotificationType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import notificationService from '../../services/notificationService';

export async function handleFriendRequestSentNotifications(event: DomainEventUnion) {
  if (event.type !== EventTypes.FriendRequestSent) return;

  const { friendshipId, requesterId, addresseeId } = event.payload;

  if (!addresseeId) return;

  await notificationService.createNotification(addresseeId, NotificationType.FRIENDSHIP_REQUEST, {
    friendshipId,
    requesterId,
  });
}
