import { NotificationType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import notificationService from '../../services/notificationService';

export async function handleAchievementAwardedNotifications(event: DomainEventUnion) {
  if (event.type !== EventTypes.AchievementAwarded) return;

  const { userId, achievementId, name, type } = event.payload;

  await notificationService.createNotification(userId, NotificationType.ACHIEVEMENT_EARNED, {
    achievementId,
    name,
    type,
  });
}
