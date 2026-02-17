import { NotificationType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import notificationService from '../../services/notificationService';

export async function handleOrganizationMemberRemovedNotifications(event: DomainEventUnion) {
  if (event.type !== EventTypes.OrganizationMemberRemoved) return;

  const { organizationId, userId, removedBy } = event.payload;

  await notificationService.createNotification(userId, NotificationType.ORGANIZATION_MEMBER_REMOVED, {
    organizationId,
    removedBy,
  });
}
