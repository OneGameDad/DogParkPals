import { PrismaClient, NotificationType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import notificationService from '../../services/notificationService';

const prisma = new PrismaClient();

export async function handleDogPhotoDeletedNotifications(event: DomainEventUnion) {
  if (event.type !== EventTypes.DogPhotoDeleted) return;

  const { dogId, previousUrl } = event.payload;

  const owners = await prisma.dogOwner.findMany({
    where: { dogId },
    select: { userId: true },
  });

  const ownerIds = owners.map((owner) => owner.userId);
  if (ownerIds.length === 0) return;

  await notificationService.createNotifications(ownerIds, NotificationType.DOG_PHOTO_REMOVED, {
    dogId,
    previousUrl,
  });
}
