import express from "express";
import achievementController from "../controllers/achievementController";
import { requireAuth } from "../middlewares/authMiddleware";
import { requireRole } from "../middlewares/authorizationMiddleware";

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Create achievement (admin/developer only)
router.post("/", requireRole('ADMIN', 'DEVELOPER'), achievementController.createAchievement);

// Get all achievements (authenticated)
router.get("/", achievementController.getAllAchievements);

// Search by name (authenticated) - must come before /:id
router.get("/search", achievementController.getAchievementByName);

// Award achievement (admin/developer only) - must come before /user/:userId
router.post("/award", requireRole('ADMIN', 'DEVELOPER'), achievementController.awardAchievementToUser);

// Remove achievement from user (admin/developer only) - more specific, must come before /user/:userId
router.delete("/user/:userId/:achievementId", requireRole('ADMIN', 'DEVELOPER'), achievementController.removeAchievementFromUser);

// Get all achievements for user (authenticated)
router.get("/user/:userId", achievementController.getUserAchievements);

// Get achievement by ID (authenticated)
router.get("/:id", achievementController.getAchievementById);

// Update achievement (admin/developer only)
router.put("/:id", requireRole('ADMIN', 'DEVELOPER'), achievementController.updateAchievement);

// Delete achievement (admin/developer only)
router.delete("/:id", requireRole('ADMIN', 'DEVELOPER'), achievementController.deleteAchievement);

export default router;
