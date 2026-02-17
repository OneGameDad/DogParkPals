import { PrismaClient, NotificationType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import notificationService from '../../services/notificationService';

const prisma = new PrismaClient();

export async function handleParkDeletedNotifications(event: DomainEventUnion) {
  if (event.type !== EventTypes.ParkDeleted) return;

  const { parkId, name, favoriteUserIds, deletedBy } = event.payload;

  const staff = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'DEVELOPER'] } },
    select: { id: true },
  });

  const recipientIds = [
    ...(favoriteUserIds ?? []),
    ...staff.map((user) => user.id),
  ];

  await notificationService.createNotifications(recipientIds, NotificationType.PARK_DELETED, {
    parkId,
    name,
    deletedBy,
  });
}
