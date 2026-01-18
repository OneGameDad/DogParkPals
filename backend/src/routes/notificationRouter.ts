import express from "express";
import notificationController from "../controllers/notificationController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = express.Router();

router.use(requireAuth);

// Get all notifications for the logged-in user
router.get(
  "/notifications",
  (req, res, next) => notificationController.getNotifications(req, res, next)
);

// Mark a single notification as read
router.patch(
  "/notifications/:id/read",
  (req, res, next) => notificationController.markAsRead(req, res, next)
);

// Mark all notifications as read
router.patch(
  "/notifications/read-all",
  (req, res, next) => notificationController.markAllAsRead(req, res, next)
);

export default router;