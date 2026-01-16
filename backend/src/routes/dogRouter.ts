import express from "express";
import dogController from "../controllers/dogController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = express.Router();

router.use(requireAuth);
router.post("/dogs", (req, res, next) => dogController.addDog(req, res, next));
router.get("/dogs", (req, res, next) => dogController.getAllDogs(req, res, next));
router.get("/dogs/:id", (req, res, next) => dogController.getDogById(req, res, next));
router.get("/dogs/owner/:ownerId", (req, res, next) => dogController.getDogByOwner(req, res, next));
router.get("/dogs/park/:parkId", (req, res, next) => dogController.getAllDogsByPark(req, res, next));
router.put("/dogs/:id", (req, res, next) => dogController.updateDog(req, res, next));
router.delete("/dogs/:id", (req, res, next) => dogController.deleteDog(req, res, next));
router.post("/dogs/:id/owners", (req, res, next) => dogController.addOwnerToDog(req, res, next));
router.delete("/dogs/:id/owners", (req, res, next) => dogController.removeOwnerFromDog(req, res, next));

export default router;