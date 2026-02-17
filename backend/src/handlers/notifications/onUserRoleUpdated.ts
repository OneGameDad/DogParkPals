import { NotificationType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import notificationService from '../../services/notificationService';

export async function handleUserRoleUpdatedNotifications(event: DomainEventUnion) {
  if (event.type !== EventTypes.UserRoleUpdated) return;

  const { targetUserId, role } = event.payload;

  await notificationService.createNotification(targetUserId, NotificationType.USER_ROLE_UPDATED, {
    role,
  });
}
