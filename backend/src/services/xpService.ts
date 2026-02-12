import { PrismaClient, Prisma, Levels, AchievementType } from '@prisma/client';
import typeSafeLogger from '../utils/typeSafeLogger';
import { toAppError } from '../utils/errors';
import achievementService from './achievementService';
import { XP_ACHIEVEMENT_THRESHOLDS } from '../config/achivements';

const prisma = new PrismaClient();

export const XP_REWARDS = {
  LOGIN: 5,
  ADD_DOG: 50,
  ADD_OWNER_TO_DOG: 20,
  JOIN_EVENT: 5,
  CREATE_EVENT: 15,
  MESSAGE_FRIEND: 1,
  ADD_ENEMY: 25,
  JOIN_ORGANIZATION: 40,
  ADD_FRIEND: 25,
  PARK_VISIT: 10,
  NEW_PARK_BONUS: 30,
} as const;

type PrismaClientOrTx = PrismaClient | Prisma.TransactionClient;

type AwardResult = {
  totalExp: number;
  level?: Levels | null;
};

function getClient(tx?: PrismaClientOrTx) {
  return tx ?? prisma;
}

async function findLevelForPoints(client: PrismaClientOrTx, totalExp: number) {
  return client.levels.findFirst({
    where: { minPoints: { lte: totalExp } },
    orderBy: { minPoints: 'desc' },
  });
}

async function syncUserLevel(client: PrismaClientOrTx, userId: number, level: Levels | null) {
  if (!level) return null;

  await client.userLevel.deleteMany({
    where: {
      userId,
      levelId: { not: level.id },
    },
  });

  await client.userLevel.upsert({
    where: { userId_levelId: { userId, levelId: level.id } },
    update: {},
    create: { userId, levelId: level.id },
  });

  return level;
}

async function awardXpAchievements(client: PrismaClientOrTx, userId: number, totalExp: number) {
  const eligible = XP_ACHIEVEMENT_THRESHOLDS.filter((threshold) => totalExp >= threshold.minXp);
  if (eligible.length === 0) return;

  const achievements = await client.achievements.findMany({
    where: {
      OR: eligible.map((threshold) => ({
        name: threshold.name,
        type: threshold.type,
      })),
    },
  });

  for (const achievement of achievements) {
    await client.userAchievement.upsert({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
      update: {},
      create: {
        userId,
        achievementId: achievement.id,
      },
    });
  }
}

async function runAward(client: PrismaClientOrTx, userId: number, amount: number, reason: string): Promise<AwardResult> {
  if (amount <= 0) {
    return { totalExp: 0, level: null };
  }

  const updatedUser = await client.user.update({
    where: { id: userId },
    data: { ExpPoints: { increment: amount } },
  });

  const level = await findLevelForPoints(client, updatedUser.ExpPoints);
  const syncedLevel = await syncUserLevel(client, userId, level);
  await awardXpAchievements(client, userId, updatedUser.ExpPoints);

  typeSafeLogger.logUserAction('XP awarded', {
    userId,
    amount,
    reason,
    totalExp: updatedUser.ExpPoints,
    levelId: syncedLevel?.id,
  });

  return { totalExp: updatedUser.ExpPoints, level: syncedLevel };
}

export async function awardExperience(
  userId: number,
  amount: number,
  reason: string,
  tx?: PrismaClientOrTx
): Promise<AwardResult> {
  try {
    if (tx) {
      return await runAward(tx, userId, amount, reason);
    }
    return await prisma.$transaction((trx: Prisma.TransactionClient) => runAward(trx, userId, amount, reason));
  } catch (error) {
    throw toAppError(error, {
      message: 'Failed to award experience',
      code: 'AWARD_XP_FAILED',
    });
  }
}

export async function awardAchievement(
  userId: number,
  name: string,
  type: AchievementType,
  tx?: PrismaClientOrTx
) {
  const client = getClient(tx);
  const achievement = await client.achievements.findFirst({
    where: {
      name,
      type,
    },
  });

  if (!achievement) {
    return null;
  }

  try {
    await achievementService.awardAchievementToUser(userId, achievement.id, tx);
  } catch (error) {
    if (error instanceof Error && error.message === 'User already has this achievement') {
      return achievement;
    }
    throw error;
  }

  return achievement;
}

export async function awardParkPatrolIfEligible(
  userId: number,
  parkId: number,
  tx?: PrismaClientOrTx
) {
  const client = getClient(tx);
  const visitCount = await client.checkIn.count({
    where: {
      userId,
      parkId,
    },
  });

  if (visitCount < 10) {
    return null;
  }

  return awardAchievement(userId, "Park Patrol", AchievementType.BADGE, client);
}

export async function awardSirBarksALotIfEligible(userId: number, tx?: PrismaClientOrTx) {
  const client = getClient(tx);
  const sentCount = await client.messages.count({
    where: {
      senderId: userId,
    },
  });

  if (sentCount < 20) {
    return null;
  }

  return awardAchievement(userId, "Sir Barks-A-Lot", AchievementType.BADGE, client);
}

export async function hasVisitedParkBefore(userId: number, parkId: number, excludeCheckInId?: number) {
  const client = getClient();
  const count = await client.checkIn.count({
    where: {
      userId,
      parkId,
      ...(excludeCheckInId ? { id: { not: excludeCheckInId } } : {}),
    },
  });
  return count > 0;
}
