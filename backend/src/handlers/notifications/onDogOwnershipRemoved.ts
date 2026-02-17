import { NotificationType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import notificationService from '../../services/notificationService';

export async function handleDogOwnershipRemovedNotifications(event: DomainEventUnion) {
  if (event.type !== EventTypes.DogOwnershipRemoved) return;

  const { dogId, userId, removedBy } = event.payload;

  await notificationService.createNotification(userId, NotificationType.DOG_OWNERSHIP_REMOVED, {
    dogId,
    removedBy,
  });
}
