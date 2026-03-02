import express from "express";
import fileController from "../controllers/fileController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = express.Router();

// Dog photo endpoint is public
// Dog document (vaccination record) endpoint requires authentication
// User profile picture endpoint is public
router.use("/dogs/:dogId/document", requireAuth);
router.use("/", fileController);

export default router;