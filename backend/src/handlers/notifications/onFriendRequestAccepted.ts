import { NotificationType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import notificationService from '../../services/notificationService';

export async function handleFriendRequestAcceptedNotifications(event: DomainEventUnion) {
  if (event.type !== EventTypes.FriendRequestAccepted) return;

  const { friendshipId, requesterId, addresseeId } = event.payload;

  if (!requesterId) return;

  await notificationService.createNotification(requesterId, NotificationType.FRIENDSHIP_ACCEPTED, {
    friendshipId,
    addresseeId,
  });
}
