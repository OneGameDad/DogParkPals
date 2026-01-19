import express from "express";
import notificationController from "../controllers/notificationController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = express.Router();

router.use(requireAuth);

router.get(
  "/notifications",
  (req, res, next) => notificationController.getNotifications(req, res, next)
);
router.patch(
  "/notifications/:id/read",
  (req, res, next) => notificationController.markAsRead(req, res, next)
);
router.patch(
  "/notifications/read-all",
  (req, res, next) => notificationController.markAllAsRead(req, res, next)
);

export default router;