import { PrismaClient, Prisma } from '@prisma/client';
import typeSafeLogger from '../utils/typeSafeLogger';
import { toAppError } from '../utils/errors';
import { addDogEnemySchema, removeDogEnemySchema, checkDogEnemySchema } from '../utils/validationSchemas';

const prisma = new PrismaClient();

const dogEnemyService = {
  async addDogEnemy(ownerId: number, ownerDogId: number, enemyDogId: number) {
    try {
      // Validate input
      const validatedData = addDogEnemySchema.parse({ ownerDogId, enemyDogId, confirmed: false });
      
      typeSafeLogger.info('Adding dog enemy', { ownerId, ownerDogId, enemyDogId });
      
      // Check if already enemies
      const existingEnemyCount = await prisma.enemies.count({
        where: { ownerId, ownerDogId: validatedData.ownerDogId, enemyDogId: validatedData.enemyDogId },
      });
      
      if (existingEnemyCount > 0) {
        typeSafeLogger.warn('Dog enemy relationship already exists', { ownerId, ownerDogId, enemyDogId });
        return {
          requiresConfirmation: false,
          blocked: false,
          enemy: null
        };
      }
      
      // Add dog enemy directly
      const enemy = await prisma.enemies.create({
        data: { ownerId, ownerDogId: validatedData.ownerDogId, enemyDogId: validatedData.enemyDogId }
      });
      
      typeSafeLogger.logUserAction('Dog enemy added successfully', { ownerId, ownerDogId, enemyDogId });
      return { 
        requiresConfirmation: false, 
        blocked: false,
        enemy 
      };
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to add dog enemy',
        code: 'ADD_DOG_ENEMY_FAILED',
      });
      typeSafeLogger.logError('Failed to add dog enemy', appError, { ownerId, ownerDogId, enemyDogId });
      throw appError;
    }
  },

  async getDogEnemy(ownerDogId: number) {
    try {
      typeSafeLogger.info('Fetching dog enemies for dog', { ownerDogId });
      const enemies = await prisma.enemies.findMany({
        where: { ownerDogId },
        include: { enemyDog: true, ownerDog: true },
      });
      typeSafeLogger.logUserAction('Dog enemies fetched successfully', { ownerDogId, enemyCount: enemies.length });
      return enemies;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch dog enemies',
        code: 'FETCH_DOG_ENEMIES_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch dog enemies', appError, { ownerDogId });
      throw appError;
    }
  },

  async removeDogEnemy(ownerId: number, ownerDogId: number, enemyDogId: number) {
    try {
      // Validate input
      const validatedData = removeDogEnemySchema.parse({ ownerDogId, enemyDogId });
      
      typeSafeLogger.info('Checking if dog enemy relationship exists', { ownerId, ownerDogId, enemyDogId });
      const enemyCount = await prisma.enemies.count({
        where: { ownerId, ownerDogId: validatedData.ownerDogId, enemyDogId: validatedData.enemyDogId },
      });
      
      if (enemyCount === 0) {
        typeSafeLogger.warn('No dog enemy relationship found to remove', { ownerId, ownerDogId, enemyDogId });
        throw new Error('Dog enemy relationship does not exist');
      }
      
      typeSafeLogger.logUserAction('Removing dog enemy', { ownerId, ownerDogId, enemyDogId });
      await prisma.enemies.deleteMany({
        where: {
          ownerId,
          ownerDogId: validatedData.ownerDogId,
          enemyDogId: validatedData.enemyDogId,
        },
      });
      typeSafeLogger.logUserAction('Dog enemy removed successfully', { ownerId, ownerDogId, enemyDogId });
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to remove dog enemy',
        code: 'REMOVE_DOG_ENEMY_FAILED',
      });
      typeSafeLogger.logError('Failed to remove dog enemy', appError, { ownerId, ownerDogId, enemyDogId });
      throw appError;
    }
  },

  async isDogEnemy(ownerDogId: number, potentialEnemyDogId: number) {
    try {
      // Validate input
      const validatedData = checkDogEnemySchema.parse({ ownerDogId, potentialEnemyDogId });
      
      typeSafeLogger.info('Checking dog enemy relationship', { ownerDogId, potentialEnemyDogId });
      const count = await prisma.enemies.count({
        where: {
          ownerDogId: validatedData.ownerDogId,
          enemyDogId: validatedData.potentialEnemyDogId,
        },
      });
      const isEnemy = count > 0;
      typeSafeLogger.logUserAction('Dog enemy relationship check completed', { ownerDogId, potentialEnemyDogId, isEnemy });
      return isEnemy;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to check dog enemy relationship',
        code: 'CHECK_DOG_ENEMY_FAILED',
      });
      typeSafeLogger.logError('Failed to check dog enemy relationship', appError, { ownerDogId, potentialEnemyDogId });
      throw appError;
    }
  },

  async getAllDogEnemies() {
    try {
      typeSafeLogger.info('Fetching all dog enemy relationships');
      const enemies = await prisma.enemies.findMany({
        where: {
          ownerDogId: { not: null },
          enemyDogId: { not: null }
        },
        include: { enemyDog: true, ownerDog: true },
      });
      typeSafeLogger.logUserAction('All dog enemy relationships fetched successfully', { enemyCount: enemies.length });
      return enemies;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch all dog enemy relationships',
        code: 'FETCH_ALL_DOG_ENEMIES_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch all dog enemy relationships', appError, {});
      throw appError;
    }
  }
};

export default dogEnemyService;
