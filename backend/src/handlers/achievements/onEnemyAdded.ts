import { AchievementType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import { awardAchievement } from '../../services/xpService';

export async function handleEnemyAddedAchievements(event: DomainEventUnion) {
  if (event.type !== EventTypes.EnemyAdded) return;

  const { ownerId } = event.payload;

  await awardAchievement(ownerId, 'Fought The Post Man', AchievementType.BADGE);
}
