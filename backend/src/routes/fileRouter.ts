import express from "express";
import fileController from "../controllers/fileController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = express.Router();

// All file retrieval endpoints require authentication
// Additional authorization checks are enforced in controllers where needed
router.use(requireAuth);
router.use("/", fileController);

export default router;