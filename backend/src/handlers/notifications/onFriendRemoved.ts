import { NotificationType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import notificationService from '../../services/notificationService';

export async function handleFriendRemovedNotifications(event: DomainEventUnion) {
  if (event.type !== EventTypes.FriendRemoved) return;

  const { userId, friendId, dogId, friendDogId, removedBy } = event.payload;

  const recipientIds = [userId, friendId].filter((id): id is number => typeof id === 'number');

  if (recipientIds.length === 0) return;

  await notificationService.createNotifications(recipientIds, NotificationType.FRIEND_REMOVED, {
    userId,
    friendId,
    dogId,
    friendDogId,
    removedBy,
  });
}
