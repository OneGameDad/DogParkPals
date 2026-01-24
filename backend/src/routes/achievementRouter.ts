import express from "express";
import achievementController from "../controllers/achievementController";
import { requireAuth } from "../middlewares/authMiddleware";
import { requireRole } from "../middlewares/authorizationMiddleware";

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Public routes - anyone authenticated can view achievements
router.get("/", achievementController.getAllAchievements);
router.get("/search", achievementController.getAchievementByName); // Must come before /:id
router.get("/:id", achievementController.getAchievementById);

// Get all achievements for a specific user
router.get("/user/:userId", achievementController.getUserAchievements);

// Award achievement to user (admin/developer only)
router.post("/award", requireRole('ADMIN', 'DEVELOPER'), achievementController.awardAchievementToUser);

// Remove achievement from user (admin/developer only)
router.delete("/user/:userId/:achievementId", requireRole('ADMIN', 'DEVELOPER'), achievementController.removeAchievementFromUser);

// Admin/Developer only routes - create, update, delete achievements
router.post("/", requireRole('ADMIN', 'DEVELOPER'), achievementController.createAchievement);
router.put("/:id", requireRole('ADMIN', 'DEVELOPER'), achievementController.updateAchievement);
router.delete("/:id", requireRole('ADMIN', 'DEVELOPER'), achievementController.deleteAchievement);

export default router;
