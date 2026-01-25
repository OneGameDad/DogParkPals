import express from "express";
import enemyController from "../controllers/enemyController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = express.Router();

router.use(requireAuth);
router.post("/confirm", enemyController.confirmAddEnemy);
router.get("/isEnemy/:enemyUserId", enemyController.isEnemy);
router.get("/:userId", enemyController.getEnemy);
router.post("/", enemyController.addEnemy);
router.delete("/", enemyController.removeEnemy);
router.get("/", enemyController.getEnemiesList);

export default router;