import { NotificationType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import notificationService from '../../services/notificationService';

export async function handleEnemyRemovedNotifications(event: DomainEventUnion) {
  if (event.type !== EventTypes.EnemyRemoved) return;

  const { ownerId, enemyUserId } = event.payload;

  await notificationService.createNotification(ownerId, NotificationType.ENEMY_REMOVED, {
    enemyUserId,
  });
}
