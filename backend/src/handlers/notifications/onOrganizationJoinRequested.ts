import { PrismaClient, NotificationType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import notificationService from '../../services/notificationService';

const prisma = new PrismaClient();

export async function handleOrganizationJoinRequestedNotifications(event: DomainEventUnion) {
  if (event.type !== EventTypes.OrganizationJoinRequested) return;

  const { organizationId, requesterId } = event.payload;

  const [org, privilegedMembers] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { ownerId: true },
    }),
    prisma.organizationMember.findMany({
      where: {
        organizationId,
        role: { in: ['OWNER', 'MODERATOR'] },
      },
      select: { userId: true },
    }),
  ]);

  const recipientIds = new Set<number>();
  privilegedMembers.forEach((member) => recipientIds.add(member.userId));
  if (org?.ownerId) {
    recipientIds.add(org.ownerId);
  }
  recipientIds.delete(requesterId);

  await notificationService.createNotifications(Array.from(recipientIds), NotificationType.ORGANIZATION_JOIN_REQUEST, {
    organizationId,
    requesterId,
  });
}
