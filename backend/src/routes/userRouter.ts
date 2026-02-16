import express from "express";
import userController from "../controllers/userController";
import { requireAuth } from "../middlewares/authMiddleware";
import { requireRole } from "../middlewares/authorizationMiddleware";
import { uploadSingleFile } from "../middlewares/uploadMiddleware";

const router = express.Router();

router.post("/", (req, res, next) => userController.createUser(req, res, next));
router.get("/email/:email", requireAuth, (req, res, next) => userController.getUserByEmail(req, res, next));
router.get("/id/:id", requireAuth, (req, res, next) => userController.getUserById(req, res, next));
router.get("/username/:username", requireAuth, (req, res, next) => userController.getUserByUsername(req, res, next));
router.get("/", requireAuth, (req, res, next) => userController.getAllUsers(req, res, next));
router.post("/presence/heartbeat", requireAuth, (req, res, next) => userController.recordHeartbeat(req, res, next));
router.get("/presence", requireAuth, (req, res, next) => userController.getUserPresence(req, res, next));
router.get("/presence/:id", requireAuth, (req, res, next) => userController.getUserPresence(req, res, next));
router.patch("/profile", requireAuth, (req, res, next) => userController.updateProfile(req, res, next));
router.post("/change-password", requireAuth, (req, res, next) => userController.changePassword(req, res, next));
router.post("/reset-password", requireAuth, (req, res, next) => userController.resetUserPassword(req, res, next));
router.patch("/role", requireAuth, requireRole('ADMIN'), (req, res, next) => userController.changeUserRole(req, res, next));
router.post("/profile-picture", requireAuth, uploadSingleFile, (req, res, next) => userController.uploadProfilePicture(req, res, next));
router.delete("/profile-picture", requireAuth, (req, res, next) => userController.deleteProfilePicture(req, res, next));
router.delete("/:id", requireAuth, (req, res, next) => userController.deleteUser(req, res, next));

export default router;