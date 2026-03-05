import typeSafeLogger from "../utils/typeSafeLogger";
import { toAppError, isAppError } from "../utils/errors";
import { parseValidation } from "../utils/validator";
import { addDogEnemySchema, removeDogEnemySchema, checkDogEnemySchema } from "../utils/validationSchemas";
import dogEnemyService from "../services/dogEnemyService";
import { Request, Response, NextFunction } from "express";

const dogEnemyController = {
    addDogEnemy: async (req: Request, res: Response, next: NextFunction) => {
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
        const { ownerDogId, enemyDogId, confirmed } = parseValidation(addDogEnemySchema, req.body);
        typeSafeLogger.info("addDogEnemy request received", { userId, ownerDogId, enemyDogId, confirmed });
        
        // Check if authenticated user owns the ownerDog
        const result = await dogEnemyService.addDogEnemy(userId, ownerDogId, enemyDogId);
        
        typeSafeLogger.info("Dog enemy added successfully", { userId, ownerDogId, enemyDogId, enemyId: result.enemy?.id });
        return res.status(201).json(result.enemy);
    } catch (error) {
        typeSafeLogger.error("Failed to add dog enemy", { userId: (req as any).user?.id, ownerDogId: req.body.ownerDogId, enemyDogId: req.body.enemyDogId, error });
        if (isAppError(error)) {
            return next(error);
        }
        return next(toAppError(error, { 
        message: "Failed to add dog enemy", 
        code: "ADD_DOG_ENEMY_FAILED" 
        }));
    }
    },

    getDogEnemy: async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ownerDogId = Number(req.params.dogId);
        typeSafeLogger.info("getDogEnemy request received", { ownerDogId });
        const enemies = await dogEnemyService.getDogEnemy(ownerDogId);
        typeSafeLogger.info("Dog enemies retrieved successfully", { ownerDogId, count: enemies.length });
        
        return res.status(200).json(enemies);
    } catch (error) {
        typeSafeLogger.error("Failed to get dog enemies", { dogId: req.params.dogId, error });
        if (isAppError(error)) {
            return next(error);
        }
        return next(toAppError(error, { 
        message: "Failed to get dog enemies", 
        code: "GET_DOG_ENEMY_FAILED" 
        }));
    }
    },

    removeDogEnemy: async (req: Request, res: Response, next: NextFunction) => {
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
        const { ownerDogId, enemyDogId } = parseValidation(removeDogEnemySchema, req.body);
        typeSafeLogger.info("removeDogEnemy request received", { userId, ownerDogId, enemyDogId });
        
        await dogEnemyService.removeDogEnemy(userId, ownerDogId, enemyDogId);
        typeSafeLogger.info("Dog enemy removed successfully", { userId, ownerDogId, enemyDogId });
        return res.status(200).json({ message: "Dog enemy removed successfully" });
    } catch (error) {
        typeSafeLogger.error("Failed to remove dog enemy", { userId: (req as any).user?.id, ownerDogId: req.body.ownerDogId, enemyDogId: req.body.enemyDogId, error });
        if (isAppError(error)) {
            return next(error);
        }
        return next(toAppError(error, { 
        message: "Failed to remove dog enemy", 
        code: "REMOVE_DOG_ENEMY_FAILED" 
        }));
    }
    },

    isDogEnemy: async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ownerDogId = Number(req.params.dogId);
        const enemyDogId = Number(req.params.enemyDogId);
        // Validate both parameters
        parseValidation(checkDogEnemySchema, { ownerDogId, potentialEnemyDogId: enemyDogId });
        typeSafeLogger.info("isDogEnemy request received", { ownerDogId, enemyDogId });
        
        const isEnemy = await dogEnemyService.isDogEnemy(ownerDogId, enemyDogId);
        typeSafeLogger.info("Dog enemy status checked", { ownerDogId, enemyDogId, isEnemy });
        return res.status(200).json({ isEnemy });
    } catch (error) {
        typeSafeLogger.error("Failed to check dog enemy status", { dogId: req.params.dogId, enemyDogId: req.params.enemyDogId, error });
        if (isAppError(error)) {
            return next(error);
        }
        return next(toAppError(error, { 
        message: "Failed to check dog enemy status", 
        code: "CHECK_DOG_ENEMY_STATUS_FAILED" 
        }));
    }
    },

    getAllDogEnemies: async (req: Request, res: Response, next: NextFunction) => {
    try {
        typeSafeLogger.info("getAllDogEnemies request received");
        const enemiesList = await dogEnemyService.getAllDogEnemies();
        typeSafeLogger.info("Dog enemies list retrieved successfully", { count: enemiesList.length });
        
        return res.status(200).json(enemiesList);
    } catch (error) {
        typeSafeLogger.error("Failed to get dog enemies list", { error });
        if (isAppError(error)) {
            return next(error);
        }
        return next(toAppError(error, { 
        message: "Failed to get dog enemies list", 
        code: "GET_DOG_ENEMIES_LIST_FAILED" 
        }));
    }
    },
};

export default dogEnemyController;
