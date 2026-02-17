import { NotificationType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import notificationService from '../../services/notificationService';

export async function handleOrganizationDeletedNotifications(event: DomainEventUnion) {
  if (event.type !== EventTypes.OrganizationDeleted) return;

  const { organizationId, memberIds, deletedBy } = event.payload;

  if (!memberIds || memberIds.length === 0) return;

  await notificationService.createNotifications(memberIds, NotificationType.ORGANIZATION_DELETED, {
    organizationId,
    deletedBy,
  });
}
