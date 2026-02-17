import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import typeSafeLogger from '../../utils/typeSafeLogger';

export async function handleAchievementAwardedLogging(event: DomainEventUnion) {
  if (event.type !== EventTypes.AchievementAwarded) return;

  const { userId, achievementId, name, type } = event.payload;
  typeSafeLogger.logUserAction('Achievement awarded (event bus)', {
    userId,
    achievementId,
    name,
    achievementType: type,
  });
}
