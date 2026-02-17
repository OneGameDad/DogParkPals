import { PrismaClient, Prisma } from '@prisma/client';
import typeSafeLogger from '../utils/typeSafeLogger';
import { toAppError } from '../utils/errors';
import friendService from './friendService';
import { addEnemySchema, removeEnemySchema, checkEnemySchema, getUserIdSchema } from '../utils/validationSchemas';
import { createDomainEvent } from '../events/createDomainEvent';
import { EventTypes } from '../events/eventTypes';
import { addOutboxEvent } from '../infrastructure/outbox/outboxRepository';

const prisma = new PrismaClient();

const enemyService = {
    async addEnemy(userId: number, enemyUserId: number) {
    try {
      // Validate input
      const validatedData = addEnemySchema.parse({ userId, enemyUserId, confirmed: false });
      
      typeSafeLogger.info('Adding enemy', { userId, enemyUserId });
      
      // 1. Check if they're currently friends
      const existingFriend = await friendService.getFriend(validatedData.userId);
      const friendList = existingFriend.users as Array<{ id: number }>;
      const areFriends = friendList.some((friend) => friend.id === validatedData.enemyUserId);
      
      // 2. If they ARE friends, block and require confirmation
      if (areFriends) {
        typeSafeLogger.warn('Enemy is currently a friend, confirmation required', { userId, enemyUserId });
        return {
          requiresConfirmation: true,
          message: 'This user is currently your friend. Adding as enemy will remove them from friends.',
          existingRelationship: 'friend',
          blocked: true
        };
      }

      // 3. Check if already enemies
      const existingEnemyCount = await prisma.enemies.count({
        where: { ownerId: validatedData.userId, enemyUserId: validatedData.enemyUserId },
      });
      
      if (existingEnemyCount > 0) {
        typeSafeLogger.warn('Enemy relationship already exists', { userId, enemyUserId });
        return {
          requiresConfirmation: false,
          blocked: false,
          enemy: null
        };
      }
      
      // 4. If NOT friends, proceed to add enemy directly
      const enemy = await prisma.$transaction(async (tx) => {
        const createdEnemy = await tx.enemies.create({
          data: { ownerId: validatedData.userId, enemyUserId: validatedData.enemyUserId }
        });

        const domainEvent = createDomainEvent(
          EventTypes.EnemyAdded,
          {
            enemyId: createdEnemy.id,
            ownerId: createdEnemy.ownerId,
            enemyUserId: createdEnemy.enemyUserId ?? validatedData.enemyUserId,
          },
          { actorId: createdEnemy.ownerId }
        );
        await addOutboxEvent(tx, domainEvent);

        return createdEnemy;
      });
      
      typeSafeLogger.logUserAction('Enemy added successfully', { userId, enemyUserId });
      return { 
        requiresConfirmation: false, 
        blocked: false,
        enemy 
      };
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to add enemy',
        code: 'ADD_ENEMY_FAILED',
      });
      typeSafeLogger.logError('Failed to add enemy', appError, { userId, enemyUserId });
      throw appError;
    }
  },

  async confirmAddEnemy(userId: number, enemyUserId: number) {
    try {
      // Validate input
      const validatedData = addEnemySchema.parse({ userId, enemyUserId, confirmed: true });
      
      typeSafeLogger.info('Confirming enemy addition with friend removal', { userId, enemyUserId });
      
      // This should ALWAYS check friendship status again for safety
      const existingFriend = await friendService.getFriend(validatedData.userId);
      const friendList = existingFriend.users as Array<{ id: number }>;
      const areFriends = friendList.some((friend) => friend.id === validatedData.enemyUserId);
      
      if (!areFriends) {
        typeSafeLogger.warn('User is not a friend, cannot confirm enemy addition', { userId, enemyUserId });
        throw new Error('User is not a friend, use addEnemy instead');
      }
      
      // Atomic transaction: remove friend + add enemy
      const enemy = await prisma.$transaction(async (tx) => {
        const friendships = await tx.friendship.findMany({
          where: {
            OR: [
              { requesterId: validatedData.userId, addresseeId: validatedData.enemyUserId },
              { requesterId: validatedData.enemyUserId, addresseeId: validatedData.userId },
            ],
          },
          select: {
            requesterId: true,
            addresseeId: true,
            requesterDogId: true,
            addresseeDogId: true,
          },
        });

        await tx.friendship.deleteMany({
          where: {
            OR: [
              { requesterId: validatedData.userId, addresseeId: validatedData.enemyUserId },
              { requesterId: validatedData.enemyUserId, addresseeId: validatedData.userId }
            ]
          }
        });

        for (const friendship of friendships) {
          const domainEvent = createDomainEvent(
            EventTypes.FriendRemoved,
            {
              userId: friendship.requesterId ?? null,
              friendId: friendship.addresseeId ?? null,
              dogId: friendship.requesterDogId ?? null,
              friendDogId: friendship.addresseeDogId ?? null,
              removedBy: validatedData.userId,
            },
            { actorId: validatedData.userId }
          );
          await addOutboxEvent(tx, domainEvent);
        }
        
        const enemy = await tx.enemies.create({
          data: { ownerId: validatedData.userId, enemyUserId: validatedData.enemyUserId }
        });

        const domainEvent = createDomainEvent(
          EventTypes.EnemyAdded,
          {
            enemyId: enemy.id,
            ownerId: enemy.ownerId,
            enemyUserId: enemy.enemyUserId ?? validatedData.enemyUserId,
          },
          { actorId: enemy.ownerId }
        );
        await addOutboxEvent(tx, domainEvent);
        
        return enemy;
      });
      
      typeSafeLogger.logUserAction('Enemy added and friendship removed', { userId, enemyUserId });
      return enemy;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to confirm enemy addition',
        code: 'CONFIRM_ADD_ENEMY_FAILED',
      });
      typeSafeLogger.logError('Failed to confirm enemy addition', appError, { userId, enemyUserId });
      throw appError;
    }
  },

  async getEnemy(userId: number) {
    try {
      // Validate input
      const validatedData = getUserIdSchema.parse({ userId });
      
      typeSafeLogger.info('Fetching enemies for user', { userId: validatedData.userId });
      const enemies = await prisma.enemies.findMany({
        where: { ownerId: validatedData.userId },
        include: { enemyUser: true },
      });
      typeSafeLogger.logUserAction('Enemies fetched successfully', { userId: validatedData.userId, enemyCount: enemies.length });
      return enemies;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch enemies',
        code: 'FETCH_ENEMIES_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch enemies', appError, { userId });
      throw appError;
    }
  },

  async removeEnemy(userId: number, enemyUserId: number) {
    try {
      // Validate input
      const validatedData = removeEnemySchema.parse({ userId, enemyUserId });
      
      typeSafeLogger.info('Checking if enemy relationship exists', { userId: validatedData.userId, enemyUserId: validatedData.enemyUserId });
      const enemyCount = await prisma.enemies.count({
        where: { ownerId: validatedData.userId, enemyUserId: validatedData.enemyUserId },
      });
      
      if (enemyCount === 0) {
        typeSafeLogger.warn('No enemy relationship found to remove', { userId: validatedData.userId, enemyUserId: validatedData.enemyUserId });
        throw new Error('Enemy relationship does not exist');
      }
      
      typeSafeLogger.logUserAction('Removing enemy for user', { userId: validatedData.userId, enemyUserId: validatedData.enemyUserId });
      await prisma.$transaction(async (tx) => {
        await tx.enemies.deleteMany({
          where: {
            ownerId: validatedData.userId,
            enemyUserId: validatedData.enemyUserId,
          },
        });

        const domainEvent = createDomainEvent(
          EventTypes.EnemyRemoved,
          {
            ownerId: validatedData.userId,
            enemyUserId: validatedData.enemyUserId,
          },
          { actorId: validatedData.userId }
        );
        await addOutboxEvent(tx, domainEvent);
      });
      typeSafeLogger.logUserAction('Enemy removed successfully', { userId: validatedData.userId, enemyUserId: validatedData.enemyUserId });
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to remove enemy',
        code: 'REMOVE_ENEMY_FAILED',
      });
      typeSafeLogger.logError('Failed to remove enemy', appError, { userId, enemyUserId });
      throw appError;
    }
  },

  async isEnemy(userId: number, potentialEnemyUserId: number) {
    try {
      // Validate input
      const validatedData = checkEnemySchema.parse({ userId, potentialEnemyUserId });
      
      typeSafeLogger.info('Checking enemy relationship', { userId: validatedData.userId, potentialEnemyUserId: validatedData.potentialEnemyUserId });
      const count = await prisma.enemies.count({
        where: {
          ownerId: validatedData.userId,
          enemyUserId: validatedData.potentialEnemyUserId,
        },
      });
      const isEnemy = count > 0;
      typeSafeLogger.logUserAction('Enemy relationship check completed', { userId: validatedData.userId, potentialEnemyUserId: validatedData.potentialEnemyUserId, isEnemy });
      return isEnemy;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to check enemy relationship',
        code: 'CHECK_ENEMY_FAILED',
      });
      typeSafeLogger.logError('Failed to check enemy relationship', appError, { userId, potentialEnemyUserId });
      throw appError;
    }
  },

  async getAllEnemies() {
    try {
      typeSafeLogger.info('Fetching all enemy relationships');
      const enemies = await prisma.enemies.findMany({
        include: { enemyUser: true, owner: true },
      });
      typeSafeLogger.logUserAction('All enemy relationships fetched successfully', { enemyCount: enemies.length });
      return enemies;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch all enemy relationships',
        code: 'FETCH_ALL_ENEMIES_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch all enemy relationships', appError, {});
      throw appError;
    }
  }
};

export default enemyService;