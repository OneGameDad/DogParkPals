import typeSafeLogger from "../utils/typeSafeLogger";
import { toAppError, NotFoundError, isAppError } from "../utils/errors";
import { parseValidation } from "../utils/validator";
import { addEnemySchema, removeEnemySchema, getUserIdSchema } from "../utils/validationSchemas";
import enemyService from "../services/enemyService";
import { Request, Response, NextFunction } from "express";
import { awardExperience, XP_REWARDS } from "../services/xpService";

const enemyController = {
    addEnemy: async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, enemyUserId, confirmed } = parseValidation(addEnemySchema, req.body);
        typeSafeLogger.info("addEnemy request received", { userId, enemyUserId, confirmed });
        
        if (confirmed) {
        // User already confirmed, execute the operation
        const enemy = await enemyService.confirmAddEnemy(userId, enemyUserId);
        typeSafeLogger.info("Enemy added with confirmation", { userId, enemyUserId, enemyId: enemy.id });
        await awardExperience(userId, XP_REWARDS.ADD_ENEMY, 'add_enemy');
        return res.status(201).json(enemy);
        }
        
        // Check if confirmation needed
        const result = await enemyService.addEnemy(userId, enemyUserId);
        
        if (result.requiresConfirmation) {
        typeSafeLogger.info("Enemy addition requires confirmation", { userId, enemyUserId, existingRelationship: result.existingRelationship });
        return res.status(409).json({
            requiresConfirmation: true,
            message: result.message,
            existingRelationship: result.existingRelationship
        });
        }
        
        typeSafeLogger.info("Enemy added successfully", { userId, enemyUserId, enemyId: result.enemy?.id });
        if (result.enemy) {
        await awardExperience(userId, XP_REWARDS.ADD_ENEMY, 'add_enemy');
        }
        return res.status(201).json(result.enemy);
    } catch (error) {
        typeSafeLogger.error("Failed to add enemy", { userId: req.body.userId, enemyUserId: req.body.enemyUserId, error });
        if (isAppError(error)) {
            return next(error);
        }
        return next(toAppError(error, { 
        message: "Failed to add enemy", 
        code: "ADD_ENEMY_FAILED" 
        }));
    }
    },

    confirmAddEnemy: async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, enemyUserId } = parseValidation(addEnemySchema, req.body);
        typeSafeLogger.info("confirmAddEnemy request received", { userId, enemyUserId });
        
        const enemy = await enemyService.confirmAddEnemy(userId, enemyUserId);
        typeSafeLogger.info("Enemy confirmed and added successfully", { userId, enemyUserId, enemyId: enemy.id });
        await awardExperience(userId, XP_REWARDS.ADD_ENEMY, 'add_enemy');
        return res.status(201).json(enemy);
    } catch (error) {
        typeSafeLogger.error("Failed to confirm adding enemy", { userId: req.body.userId, enemyUserId: req.body.enemyUserId, error });
        if (isAppError(error)) {
            return next(error);
        }
        return next(toAppError(error, { 
        message: "Failed to confirm adding enemy", 
        code: "CONFIRM_ADD_ENEMY_FAILED" 
        }));
    }
    },

    getEnemy: async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = parseValidation(getUserIdSchema, { userId: Number(req.params.userId) });
        typeSafeLogger.info("getEnemy request received", { userId });
        const enemies = await enemyService.getEnemy(userId);
        typeSafeLogger.info("Enemies retrieved successfully", { userId, count: enemies.length });
        
        return res.status(200).json(enemies);
    } catch (error) {
        typeSafeLogger.error("Failed to get enemies", { userId: req.params.userId, error });
        if (isAppError(error)) {
            return next(error);
        }
        return next(toAppError(error, { 
        message: "Failed to get enemies", 
        code: "GET_ENEMY_FAILED" 
        }));
    }
    },

    removeEnemy: async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, enemyUserId } = parseValidation(removeEnemySchema, req.body);
        typeSafeLogger.info("removeEnemy request received", { userId, enemyUserId });
        
        await enemyService.removeEnemy(userId, enemyUserId);
        typeSafeLogger.info("Enemy removed successfully", { userId, enemyUserId });
        return res.status(200).json({ message: "Enemy removed successfully" });
    } catch (error) {
        typeSafeLogger.error("Failed to remove enemy", { userId: req.body.userId, enemyUserId: req.body.enemyUserId, error });
        if (isAppError(error)) {
            return next(error);
        }
        return next(toAppError(error, { 
        message: "Failed to remove enemy", 
        code: "REMOVE_ENEMY_FAILED" 
        }));
    }
    },

    isEnemy: async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            typeSafeLogger.error("User not authenticated");
            return next(toAppError(new Error("User not authenticated"), { 
                message: "User not authenticated", 
                code: "AUTH_ERROR",
                statusCode: 401
            }));
        }
        const enemyUserId = Number(req.params.enemyUserId);
        // Validate both parameters
        parseValidation(removeEnemySchema, { userId, enemyUserId });
        typeSafeLogger.info("isEnemy request received", { userId, enemyUserId });
        
        const isEnemy = await enemyService.isEnemy(userId, enemyUserId);
        typeSafeLogger.info("Enemy status checked", { userId, enemyUserId, isEnemy });
        return res.status(200).json({ isEnemy });
    } catch (error) {
        typeSafeLogger.error("Failed to check enemy status", { userId: (req as any).user?.id, enemyUserId: req.params.enemyUserId, error });
        if (isAppError(error)) {
            return next(error);
        }
        return next(toAppError(error, { 
        message: "Failed to check enemy status", 
        code: "CHECK_ENEMY_STATUS_FAILED" 
        }));
    }
    },

    getEnemiesList: async (req: Request, res: Response, next: NextFunction) => {
    try {
        typeSafeLogger.info("getEnemiesList request received");
        const enemiesList = await enemyService.getAllEnemies();
        typeSafeLogger.info("Enemies list retrieved successfully", { count: enemiesList.length });
        
        return res.status(200).json(enemiesList);
    } catch (error) {
        typeSafeLogger.error("Failed to get enemies list", { error });
        if (isAppError(error)) {
            return next(error);
        }
        return next(toAppError(error, { 
        message: "Failed to get enemies list", 
        code: "GET_ENEMIES_LIST_FAILED" 
        }));
    }
    },
};

export default enemyController;