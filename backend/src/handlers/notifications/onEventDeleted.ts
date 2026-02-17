import { PrismaClient, NotificationType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import notificationService from '../../services/notificationService';

const prisma = new PrismaClient();

export async function handleEventDeletedNotifications(event: DomainEventUnion) {
  if (event.type !== EventTypes.EventDeleted) return;

  const { eventId, organizerId, organizationId, parkId, title, attendeeIds } = event.payload;

  const orgLeaders = organizationId
    ? await prisma.organizationMember.findMany({
        where: {
          organizationId,
          role: { in: ['MODERATOR', 'OWNER'] },
        },
        select: { userId: true },
      })
    : [];

  const recipientIds = [
    ...(attendeeIds ?? []),
    ...orgLeaders.map((member) => member.userId),
  ];

  await notificationService.createNotifications(recipientIds, NotificationType.EVENT_DELETED, {
    eventId,
    organizerId,
    organizationId,
    parkId,
    title,
  });
}
