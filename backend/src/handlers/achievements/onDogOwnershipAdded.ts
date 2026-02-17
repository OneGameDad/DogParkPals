import { PrismaClient, AchievementType } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import { awardAchievement } from '../../services/xpService';

const prisma = new PrismaClient();

export async function handleDogOwnershipAddedAchievements(event: DomainEventUnion) {
  if (event.type !== EventTypes.DogOwnershipAdded) return;

  const { dogId, userId } = event.payload;

  const ownerCount = await prisma.dogOwner.count({
    where: { dogId },
  });

  if (ownerCount <= 0) return;

  if (ownerCount === 1) {
    await awardAchievement(userId, 'Best Friend', AchievementType.BADGE);
    return;
  }

  await awardAchievement(userId, 'Family Dog', AchievementType.BADGE);
}
