import { NotificationType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import notificationService from '../../services/notificationService';

export async function handleDogDeletedNotifications(event: DomainEventUnion) {
  if (event.type !== EventTypes.DogDeleted) return;

  const { dogId, name, ownerIds, deletedBy } = event.payload;

  if (!ownerIds || ownerIds.length === 0) return;

  await notificationService.createNotifications(ownerIds, NotificationType.DOG_DELETED, {
    dogId,
    name,
    deletedBy,
  });
}
