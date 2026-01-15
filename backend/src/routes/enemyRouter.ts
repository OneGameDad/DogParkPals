import express from "express";
import enemyController from "../controllers/enemyController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = express.Router();

router.use(requireAuth);
router.post("/enemies", enemyController.addEnemy);
router.post("/enemies/confirm", enemyController.confirmAddEnemy);
router.delete("/enemies", enemyController.removeEnemy);
router.get("/enemies/:userId", enemyController.getEnemy);
router.get("/enemies", enemyController.getEnemiesList);
router.get("/enemies/isEnemy/:enemyUserId", enemyController.isEnemy);

export default router;