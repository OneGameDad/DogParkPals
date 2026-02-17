import { AchievementType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import { awardAchievement } from '../../services/xpService';

export async function handleOrganizationJoinApprovedAchievements(event: DomainEventUnion) {
  if (event.type !== EventTypes.OrganizationJoinApproved) return;

  const { userId, role } = event.payload;

  if (role === 'OWNER') {
    await awardAchievement(userId, 'Pack Leader', AchievementType.BADGE);
    return;
  }

  await awardAchievement(userId, 'Pack Member', AchievementType.BADGE);
}
