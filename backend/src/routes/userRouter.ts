import express from "express";
import userController from "../controllers/userController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/users", (req, res, next) => userController.createUser(req, res, next));
router.get("/users/email/:email", (req, res, next) => userController.getUserByEmail(req, res, next));
router.get("/users/id/:id", (req, res, next) => userController.getUserById(req, res, next));
router.get("/users/username/:username", (req, res, next) => userController.getUserByUsername(req, res, next));
router.get("/users", (req, res, next) => userController.getAllUsers(req, res, next));
router.delete("/users/:id", requireAuth, (req, res, next) => userController.deleteUser(req, res, next));
router.post("/users/change-password", requireAuth, (req, res, next) => userController.changePassword(req, res, next));
router.post("/users/forgot-password", (req, res, next) => userController.forgotPassword(req, res, next));
router.post("/users/reset-password", (req, res, next) => userController.resetPassword(req, res, next));

export default router;