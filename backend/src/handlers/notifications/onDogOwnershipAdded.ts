import { NotificationType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import notificationService from '../../services/notificationService';

export async function handleDogOwnershipAddedNotifications(event: DomainEventUnion) {
  if (event.type !== EventTypes.DogOwnershipAdded) return;

  const { dogId, userId } = event.payload;

  await notificationService.createNotification(userId, NotificationType.DOG_OWNERSHIP_ADDED, {
    dogId,
  });
}
