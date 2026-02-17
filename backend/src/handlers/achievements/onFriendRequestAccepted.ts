import { AchievementType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import { awardAchievement } from '../../services/xpService';

export async function handleFriendRequestAcceptedAchievements(event: DomainEventUnion) {
  if (event.type !== EventTypes.FriendRequestAccepted) return;

  const { requesterId, addresseeId } = event.payload;
  const awards: Promise<unknown>[] = [];

  if (requesterId) {
    awards.push(awardAchievement(requesterId, 'Okay Friend', AchievementType.BADGE));
  }

  if (addresseeId) {
    awards.push(awardAchievement(addresseeId, 'Okay Friend', AchievementType.BADGE));
  }

  if (awards.length > 0) {
    await Promise.all(awards);
  }
}
