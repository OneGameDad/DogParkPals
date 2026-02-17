import { AchievementType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import { awardAchievement } from '../../services/xpService';

export async function handleEventAttendedAchievements(event: DomainEventUnion) {
  if (event.type !== EventTypes.EventAttended) return;

  const { userId } = event.payload;

  await awardAchievement(userId, 'Pup Pal', AchievementType.BADGE);
}
