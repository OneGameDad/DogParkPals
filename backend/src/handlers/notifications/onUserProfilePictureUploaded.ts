import { NotificationType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import notificationService from '../../services/notificationService';

export async function handleUserProfilePictureUploadedNotifications(event: DomainEventUnion) {
  if (event.type !== EventTypes.UserProfilePictureUploaded) return;

  const { userId, profilePictureUrl } = event.payload;

  await notificationService.createNotification(userId, NotificationType.USER_PHOTO_UPLOADED, {
    profilePictureUrl,
  });
}
