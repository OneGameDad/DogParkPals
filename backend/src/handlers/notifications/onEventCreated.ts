import { PrismaClient, NotificationType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import notificationService from '../../services/notificationService';

const prisma = new PrismaClient();

export async function handleEventCreatedNotifications(event: DomainEventUnion) {
  if (event.type !== EventTypes.EventCreated) return;

  const { eventId, parkId, organizationId, title, organizerId } = event.payload;

  const favoriteUsers = await prisma.userFavoritePark.findMany({
    where: { parkId },
    select: { userId: true },
  });

  const orgMembers = organizationId
    ? await prisma.organizationMember.findMany({
        where: { organizationId },
        select: { userId: true },
      })
    : [];

  const recipientIds = [
    ...favoriteUsers.map((favorite) => favorite.userId),
    ...orgMembers.map((member) => member.userId),
  ].filter((userId) => userId !== organizerId);

  await notificationService.createNotifications(recipientIds, NotificationType.EVENT_CREATED, {
    eventId,
    parkId,
    organizationId,
    title,
  });
}
