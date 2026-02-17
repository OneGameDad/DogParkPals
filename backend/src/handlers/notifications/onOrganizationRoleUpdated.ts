import { NotificationType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import notificationService from '../../services/notificationService';

export async function handleOrganizationRoleUpdatedNotifications(event: DomainEventUnion) {
  if (event.type !== EventTypes.OrganizationRoleUpdated) return;

  const { organizationId, userId, role } = event.payload;

  await notificationService.createNotification(userId, NotificationType.ORGANIZATION_ROLE_UPDATED, {
    organizationId,
    role,
  });
}
