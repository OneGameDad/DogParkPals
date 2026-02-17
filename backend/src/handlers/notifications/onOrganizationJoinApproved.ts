import { NotificationType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import notificationService from '../../services/notificationService';

export async function handleOrganizationJoinApprovedNotifications(event: DomainEventUnion) {
  if (event.type !== EventTypes.OrganizationJoinApproved) return;

  const { organizationId, userId, role } = event.payload;

  await notificationService.createNotification(userId, NotificationType.ORGANIZATION_JOIN_APPROVED, {
    organizationId,
    role,
  });
}
