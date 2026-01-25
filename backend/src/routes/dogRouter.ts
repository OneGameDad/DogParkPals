import express from "express";
import dogController from "../controllers/dogController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = express.Router();

router.use(requireAuth);
router.get("/owner/:ownerId", (req, res, next) => dogController.getDogByOwner(req, res, next));
router.get("/park/:parkId", (req, res, next) => dogController.getAllDogsByPark(req, res, next));
router.post("/:id/owners", (req, res, next) => dogController.addOwnerToDog(req, res, next));
router.delete("/:id/owners", (req, res, next) => dogController.removeOwnerFromDog(req, res, next));
router.get("/:id", (req, res, next) => dogController.getDogById(req, res, next));
router.put("/:id", (req, res, next) => dogController.updateDog(req, res, next));
router.delete("/:id", (req, res, next) => dogController.deleteDog(req, res, next));
router.post("/", (req, res, next) => dogController.addDog(req, res, next));
router.get("/", (req, res, next) => dogController.getAllDogs(req, res, next));

export default router;