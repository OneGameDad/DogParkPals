import express from "express";
import enemyController from "../controllers/enemyController";
// TODO: Import authentication middleware when implemented
// import { authenticate } from "../middleware/authenticate";

const router = express.Router();

// All routes require authentication (add authenticate middleware when available)
// TODO: Add authenticate middleware to all routes: router.use(authenticate)
router.post("/enemies", enemyController.addEnemy);
router.post("/enemies/confirm", enemyController.confirmAddEnemy);
router.delete("/enemies", enemyController.removeEnemy);
router.get("/enemies/:userId", enemyController.getEnemy);
router.get("/enemies", enemyController.getEnemiesList);
router.get("/enemies/isEnemy/:enemyUserId", enemyController.isEnemy);

export default router;