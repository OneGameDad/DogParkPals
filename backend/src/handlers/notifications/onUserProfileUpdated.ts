import { NotificationType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import notificationService from '../../services/notificationService';

export async function handleUserProfileUpdatedNotifications(event: DomainEventUnion) {
  if (event.type !== EventTypes.UserProfileUpdated) return;

  const { userId, fields, updatedBy, username } = event.payload;

  await notificationService.createNotification(userId, NotificationType.PROFILE_UPDATED, {
    fields,
    ...(updatedBy ? { updatedBy } : {}),
    ...(username ? { username } : {}),
  });
}
