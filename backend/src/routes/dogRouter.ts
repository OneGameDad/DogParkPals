import express from "express";
import dogController from "../controllers/dogController";
import dogEnemyController from "../controllers/dogEnemyController";
import { requireAuth } from "../middlewares/authMiddleware";
import { uploadSingleFile } from "../middlewares/uploadMiddleware";

const router = express.Router();

router.use(requireAuth);
router.get("/owner/:ownerId", (req, res, next) => dogController.getDogByOwner(req, res, next));
router.get("/park/:parkId", (req, res, next) => dogController.getAllDogsByPark(req, res, next));
router.post("/:id/owners", (req, res, next) => dogController.addOwnerToDog(req, res, next));
router.delete("/:id/owners", (req, res, next) => dogController.removeOwnerFromDog(req, res, next));
router.post("/:id/photo", uploadSingleFile, (req, res, next) => dogController.uploadDogPhoto(req, res, next));
router.post("/:id/document", uploadSingleFile, (req, res, next) => dogController.uploadDocument(req, res, next));
router.delete("/:id/photo", (req, res, next) => dogController.deleteDogPhoto(req, res, next));
router.delete("/:id/document", (req, res, next) => dogController.deleteDocument(req, res, next));
// Dog enemy routes
router.post("/:id/enemies", (req, res, next) => dogEnemyController.addDogEnemy(req, res, next));
router.get("/:dogId/enemies", (req, res, next) => dogEnemyController.getDogEnemy(req, res, next));
router.delete("/:id/enemies", (req, res, next) => dogEnemyController.removeDogEnemy(req, res, next));
router.get("/:dogId/enemies/check/:enemyDogId", (req, res, next) => dogEnemyController.isDogEnemy(req, res, next));
router.get("/:id", (req, res, next) => dogController.getDogById(req, res, next));
router.put("/:id", (req, res, next) => dogController.updateDog(req, res, next));
router.delete("/:id", (req, res, next) => dogController.deleteDog(req, res, next));
router.post("/", (req, res, next) => dogController.addDog(req, res, next));
router.get("/", (req, res, next) => dogController.getAllDogs(req, res, next));

export default router;