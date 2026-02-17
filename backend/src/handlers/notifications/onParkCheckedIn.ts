import { NotificationType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import notificationService from '../../services/notificationService';

export async function handleParkCheckedInNotifications(event: DomainEventUnion) {
  if (event.type !== EventTypes.ParkCheckedIn) return;

  const { userId, parkId, dogId } = event.payload;

  await notificationService.createNotification(userId, NotificationType.PARK_CHECKED_IN, {
    parkId,
    ...(dogId ? { dogId } : {}),
  });
}
