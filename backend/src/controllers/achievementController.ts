import achievementService from "../services/achievementService";
import { isAppError } from "../utils/errors";
import { Request, Response, NextFunction } from "express";
import typeSafeLogger from "../utils/typeSafeLogger";
import { toAppError } from "../utils/errors";
import { createAchievementSchema, updateAchievementSchema, awardAchievementSchema, getAchievementByNameSchema } from "../utils/validationSchemas";
import { parseValidation } from "../utils/validator";
import { AchievementType } from "@prisma/client";

const achievementController = {
  // Get all achievements (public)
  getAllAchievements: async (req: Request, res: Response, next: NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to fetch all achievements", { method: req.method, path: req.path });
      
      const achievements = await achievementService.getAllAchievements();
      typeSafeLogger.logUserAction("All achievements retrieved", { count: achievements.length });
      res.status(200).json(achievements);
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(
        toAppError(error, { message: "Failed to retrieve achievements", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },

  // Get achievement by ID (public)
  getAchievementById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to fetch achievement by ID", { method: req.method, path: req.path });
      const achievementId = parseInt(req.params.id, 10);

      const achievement = await achievementService.getAchievementById(achievementId);
      typeSafeLogger.logUserAction("Achievement retrieved", { achievementId });
      res.status(200).json(achievement);
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(
        toAppError(error, { message: "Failed to retrieve achievement", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },

  // Get achievement by name (public)
  getAchievementByName: async (req: Request, res: Response, next: NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to fetch achievement by name", { method: req.method, path: req.path });
      const { name } = parseValidation(getAchievementByNameSchema, req.query);

      const achievement = await achievementService.getAchievementByName(name);
      typeSafeLogger.logUserAction("Achievement retrieved by name", { name });
      res.status(200).json(achievement);
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(
        toAppError(error, { message: "Failed to retrieve achievement", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },

  // Create achievement (admin/developer only)
  createAchievement: async (req: Request, res: Response, next: NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to create achievement", { method: req.method, path: req.path });

      const validatedData = parseValidation(createAchievementSchema, req.body);
      
      const newAchievement = await achievementService.createAchievement({
        name: validatedData.name,
        type: validatedData.type as AchievementType | undefined,
        description: validatedData.description,
        badgeUrl: validatedData.badgeUrl,
      });
      
      typeSafeLogger.logUserAction("Achievement created", { 
        achievementId: newAchievement.id, 
        name: newAchievement.name 
      });
      res.status(201).json(newAchievement);
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(
        toAppError(error, { message: "Failed to create achievement", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },

  // Update achievement (admin/developer only)
  updateAchievement: async (req: Request, res: Response, next: NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to update achievement", { method: req.method, path: req.path });
      const achievementId = parseInt(req.params.id, 10);

      const validatedUpdates = parseValidation(updateAchievementSchema, req.body);
      
      const updatedAchievement = await achievementService.updateAchievement(achievementId, {
        name: validatedUpdates.name,
        type: validatedUpdates.type as AchievementType | undefined,
        description: validatedUpdates.description,
        badgeUrl: validatedUpdates.badgeUrl,
      });
      
      typeSafeLogger.logUserAction("Achievement updated", { achievementId });
      res.status(200).json(updatedAchievement);
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(
        toAppError(error, { message: "Failed to update achievement", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },

  // Delete achievement (admin/developer only)
  deleteAchievement: async (req: Request, res: Response, next: NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to delete achievement", { method: req.method, path: req.path });
      const achievementId = parseInt(req.params.id, 10);

      await achievementService.deleteAchievement(achievementId);
      typeSafeLogger.logUserAction("Achievement deleted", { achievementId });
      res.status(204).send();
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(
        toAppError(error, { message: "Failed to delete achievement", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },

  // Award achievement to user (admin/developer only)
  awardAchievementToUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to award achievement to user", { method: req.method, path: req.path });

      const validatedData = parseValidation(awardAchievementSchema, req.body);
      
      const userAchievement = await achievementService.awardAchievementToUser(
        validatedData.userId,
        validatedData.achievementId
      );
      
      typeSafeLogger.logUserAction("Achievement awarded to user", { 
        userId: validatedData.userId, 
        achievementId: validatedData.achievementId 
      });
      res.status(201).json(userAchievement);
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(
        toAppError(error, { message: "Failed to award achievement", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },

  // Get all achievements for a user (authenticated)
  getUserAchievements: async (req: Request, res: Response, next: NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to fetch user achievements", { method: req.method, path: req.path });
      const userId = parseInt(req.params.userId, 10);

      const userAchievements = await achievementService.getUserAchievements(userId);
      typeSafeLogger.logUserAction("User achievements retrieved", { 
        userId, 
        count: userAchievements.length 
      });
      res.status(200).json(userAchievements);
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(
        toAppError(error, { message: "Failed to retrieve user achievements", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },

  // Remove achievement from user (admin/developer only)
  removeAchievementFromUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to remove achievement from user", { method: req.method, path: req.path });

      const userId = parseInt(req.params.userId, 10);
      const achievementId = parseInt(req.params.achievementId, 10);
      
      await achievementService.removeAchievementFromUser(userId, achievementId);
      
      typeSafeLogger.logUserAction("Achievement removed from user", { 
        userId, 
        achievementId 
      });
      res.status(204).send();
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(
        toAppError(error, { message: "Failed to remove achievement from user", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },
};

export default achievementController;
