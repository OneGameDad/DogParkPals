import express from "express";
import fileController from "../controllers/fileController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = express.Router();

router.use(requireAuth);
router.use("/", fileController);

export default router;