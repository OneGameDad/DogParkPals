import { NotificationType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import notificationService from '../../services/notificationService';

export async function handleUserProfilePictureDeletedNotifications(event: DomainEventUnion) {
  if (event.type !== EventTypes.UserProfilePictureDeleted) return;

  const { userId, previousUrl } = event.payload;

  await notificationService.createNotification(userId, NotificationType.USER_PHOTO_REMOVED, {
    previousUrl,
  });
}
