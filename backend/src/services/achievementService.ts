import { PrismaClient, Prisma, AchievementType } from '@prisma/client';
import typeSafeLogger from '../utils/typeSafeLogger';
import { NotFoundError, toAppError, ConflictError } from '../utils/errors';
import { createDomainEvent } from '../events/createDomainEvent';
import { EventTypes } from '../events/eventTypes';
import { addOutboxEvent } from '../infrastructure/outbox/outboxRepository';

const prisma = new PrismaClient();

type PrismaClientOrTx = PrismaClient | Prisma.TransactionClient;

const achievementService = {
  
  async getAllAchievements(tx?: PrismaClientOrTx) {
    typeSafeLogger.info('Fetching all achievements');
    try {
      const client = tx ?? prisma;
      const achievements = await client.achievements.findMany({
        orderBy: { createdAt: 'desc' }
      });
      typeSafeLogger.logUserAction('All achievements retrieved', { count: achievements.length });
      return achievements;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch all achievements',
        code: 'FETCH_ACHIEVEMENTS_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch all achievements', appError);
      throw appError;
    }
  },

  async getAchievementById(achievementId: number, tx?: PrismaClientOrTx) {
    typeSafeLogger.info('Fetching achievement by ID', { achievementId });
    try {
      const client = tx ?? prisma;
      const achievement = await client.achievements.findUnique({
        where: { id: achievementId },
      });
      if (!achievement) {
        typeSafeLogger.warn('Achievement not found by ID', { achievementId });
        throw NotFoundError('Achievement not found');
      }
      typeSafeLogger.logUserAction('Achievement found by ID', { achievementId });
      return achievement;
    } catch (error) {
      if (error instanceof Error && error.message === 'Achievement not found') {
        throw error;
      }
      const appError = toAppError(error, {
        message: 'Failed to fetch achievement by ID',
        code: 'FETCH_ACHIEVEMENT_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch achievement by ID', appError, { achievementId });
      throw appError;
    }
  },

  async getAchievementByName(name: string, tx?: PrismaClientOrTx) {
    typeSafeLogger.info('Fetching achievement by name', { name });
    try {
      const client = tx ?? prisma;
      const achievement = await client.achievements.findFirst({
        where: { name },
      });
      if (!achievement) {
        typeSafeLogger.warn('Achievement not found by name', { name });
        throw NotFoundError('Achievement not found');
      }
      typeSafeLogger.logUserAction('Achievement found by name', { name, achievementId: achievement.id });
      return achievement;
    } catch (error) {
      if (error instanceof Error && error.message === 'Achievement not found') {
        throw error;
      }
      const appError = toAppError(error, {
        message: 'Failed to fetch achievement by name',
        code: 'FETCH_ACHIEVEMENT_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch achievement by name', appError, { name });
      throw appError;
    }
  },

  async createAchievement(data: { 
    name: string; 
    type?: AchievementType; 
    description?: string; 
    badgeUrl?: string;
  }, tx?: PrismaClientOrTx) {
    typeSafeLogger.logUserAction('Creating achievement', { name: data.name });
    try {
      const client = tx ?? prisma;
      // Check if achievement with same name already exists
      const existing = await client.achievements.findFirst({
        where: { name: data.name }
      });
      if (existing) {
        throw ConflictError('Achievement with this name already exists');
      }

      const newAchievement = await client.achievements.create({
        data: {
          name: data.name,
          type: data.type || 'BADGE',
          description: data.description,
          badgeUrl: data.badgeUrl,
        },
      });
      typeSafeLogger.logUserAction('Achievement created successfully', { 
        achievementId: newAchievement.id, 
        name: newAchievement.name 
      });
      return newAchievement;
    } catch (error) {
      if (error instanceof Error && error.message === 'Achievement with this name already exists') {
        throw error;
      }
      const appError = toAppError(error, {
        message: 'Failed to create achievement',
        code: 'CREATE_ACHIEVEMENT_FAILED',
      });
      typeSafeLogger.logError('Failed to create achievement', appError, { name: data.name });
      throw appError;
    }
  },

  async updateAchievement(achievementId: number, updates: { 
    name?: string; 
    type?: AchievementType; 
    description?: string; 
    badgeUrl?: string;
  }, tx?: PrismaClientOrTx) {
    typeSafeLogger.logUserAction('Updating achievement', { achievementId, updates });
    try {
      const client = tx ?? prisma;
      // Check if achievement exists
      const existing = await client.achievements.findUnique({
        where: { id: achievementId }
      });
      if (!existing) {
        throw NotFoundError('Achievement not found');
      }

      // If name is being updated, check for conflicts
      if (updates.name && updates.name !== existing.name) {
        const nameConflict = await client.achievements.findFirst({
          where: { 
            name: updates.name,
            NOT: { id: achievementId }
          }
        });
        if (nameConflict) {
          throw ConflictError('Achievement with this name already exists');
        }
      }

      const updatedAchievement = await client.achievements.update({
        where: { id: achievementId },
        data: updates,
      });
      typeSafeLogger.logUserAction('Achievement updated successfully', { 
        achievementId: updatedAchievement.id 
      });
      return updatedAchievement;
    } catch (error) {
      if (error instanceof Error && (
        error.message === 'Achievement not found' || 
        error.message === 'Achievement with this name already exists'
      )) {
        throw error;
      }
      const appError = toAppError(error, {
        message: 'Failed to update achievement',
        code: 'UPDATE_ACHIEVEMENT_FAILED',
      });
      typeSafeLogger.logError('Failed to update achievement', appError, { achievementId });
      throw appError;
    }
  },

  async deleteAchievement(achievementId: number, tx?: PrismaClientOrTx) {
    typeSafeLogger.logUserAction('Deleting achievement', { achievementId });
    try {
      const client = tx ?? prisma;
      // Check if achievement exists
      const existing = await client.achievements.findUnique({
        where: { id: achievementId }
      });
      if (!existing) {
        throw NotFoundError('Achievement not found');
      }

      await client.achievements.delete({
        where: { id: achievementId },
      });
      typeSafeLogger.logUserAction('Achievement deleted successfully', { achievementId });
      return { message: 'Achievement deleted successfully' };
    } catch (error) {
      if (error instanceof Error && error.message === 'Achievement not found') {
        throw error;
      }
      const appError = toAppError(error, {
        message: 'Failed to delete achievement',
        code: 'DELETE_ACHIEVEMENT_FAILED',
      });
      typeSafeLogger.logError('Failed to delete achievement', appError, { achievementId });
      throw appError;
    }
  },

  async awardAchievementToUser(userId: number, achievementId: number, tx?: PrismaClientOrTx) {
    typeSafeLogger.logUserAction('Awarding achievement to user', { userId, achievementId });
    try {
      const client = tx ?? prisma;
      // Check if user exists
      const user = await client.user.findUnique({
        where: { id: userId }
      });
      if (!user) {
        throw NotFoundError('User not found');
      }

      // Check if achievement exists
      const achievement = await client.achievements.findUnique({
        where: { id: achievementId }
      });
      if (!achievement) {
        throw NotFoundError('Achievement not found');
      }

      // Check if user already has this achievement
      const existing = await client.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId
          }
        }
      });

      if (existing) {
        throw ConflictError('User already has this achievement');
      }

      const userAchievement = await client.userAchievement.create({
        data: {
          userId,
          achievementId,
        },
        include: {
          achievement: true,
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      const eventPayload = {
        userId,
        achievementId: achievement.id,
        name: achievement.name,
        type: achievement.type,
      };

      const domainEvent = createDomainEvent(EventTypes.AchievementAwarded, eventPayload, {
        actorId: userId,
      });

      await addOutboxEvent(client, domainEvent);
      
      typeSafeLogger.logUserAction('Achievement awarded to user successfully', { 
        userId, 
        achievementId 
      });
      return userAchievement;
    } catch (error) {
      if (error instanceof Error && (
        error.message === 'User not found' || 
        error.message === 'Achievement not found' ||
        error.message === 'User already has this achievement'
      )) {
        throw error;
      }
      const appError = toAppError(error, {
        message: 'Failed to award achievement to user',
        code: 'AWARD_ACHIEVEMENT_FAILED',
      });
      typeSafeLogger.logError('Failed to award achievement to user', appError, { 
        userId, 
        achievementId 
      });
      throw appError;
    }
  },

  async getUserAchievements(userId: number, tx?: PrismaClientOrTx) {
    typeSafeLogger.info('Fetching user achievements', { userId });
    try {
      const client = tx ?? prisma;
      // Check if user exists
      const user = await client.user.findUnique({
        where: { id: userId }
      });
      if (!user) {
        throw NotFoundError('User not found');
      }

      const userAchievements = await client.userAchievement.findMany({
        where: { userId },
        include: {
          achievement: true,
        },
        orderBy: { dateEarned: 'desc' }
      });
      
      typeSafeLogger.logUserAction('User achievements retrieved', { 
        userId, 
        count: userAchievements.length 
      });
      return userAchievements;
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        throw error;
      }
      const appError = toAppError(error, {
        message: 'Failed to fetch user achievements',
        code: 'FETCH_USER_ACHIEVEMENTS_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch user achievements', appError, { userId });
      throw appError;
    }
  },

  async removeAchievementFromUser(userId: number, achievementId: number, tx?: PrismaClientOrTx) {
    typeSafeLogger.logUserAction('Removing achievement from user', { userId, achievementId });
    try {
      const client = tx ?? prisma;
      // Check if user exists
      const user = await client.user.findUnique({
        where: { id: userId }
      });
      if (!user) {
        throw NotFoundError('User not found');
      }

      // Check if achievement exists
      const achievement = await client.achievements.findUnique({
        where: { id: achievementId }
      });
      if (!achievement) {
        throw NotFoundError('Achievement not found');
      }

      // Check if user has this achievement
      const existing = await client.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId
          }
        }
      });

      if (!existing) {
        throw NotFoundError('User does not have this achievement');
      }

      await client.userAchievement.delete({
        where: {
          userId_achievementId: {
            userId,
            achievementId
          }
        }
      });
      
      typeSafeLogger.logUserAction('Achievement removed from user successfully', { 
        userId, 
        achievementId 
      });
      return { message: 'Achievement removed from user successfully' };
    } catch (error) {
      if (error instanceof Error && (
        error.message === 'User not found' || 
        error.message === 'Achievement not found' ||
        error.message === 'User does not have this achievement'
      )) {
        throw error;
      }
      const appError = toAppError(error, {
        message: 'Failed to remove achievement from user',
        code: 'REMOVE_ACHIEVEMENT_FAILED',
      });
      typeSafeLogger.logError('Failed to remove achievement from user', appError, { 
        userId, 
        achievementId 
      });
      throw appError;
    }
  },

};

export default achievementService;
