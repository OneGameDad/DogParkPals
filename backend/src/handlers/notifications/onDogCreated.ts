import { NotificationType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import notificationService from '../../services/notificationService';

export async function handleDogCreatedNotifications(event: DomainEventUnion) {
  if (event.type !== EventTypes.DogCreated) return;

  const { dogId, name, ownerIds } = event.payload;

  if (!ownerIds || ownerIds.length === 0) return;

  await notificationService.createNotifications(ownerIds, NotificationType.DOG_CREATED, {
    dogId,
    name,
  });
}
