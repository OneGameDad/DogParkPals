import express from "express";
import notificationController from "../controllers/notificationController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = express.Router();

router.use(requireAuth);

router.patch(
  "/read-all",
  (req, res, next) => notificationController.markAllAsRead(req, res, next)
);
router.patch(
  "/:id/read",
  (req, res, next) => notificationController.markAsRead(req, res, next)
);
router.get(
  "/",
  (req, res, next) => notificationController.getNotifications(req, res, next)
);

export default router;