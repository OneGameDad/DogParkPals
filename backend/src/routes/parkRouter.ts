import express from "express";
import parkController from "../controllers/parkController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = express.Router();

router.use(requireAuth);
router.get("/name/:name", parkController.getParkByName);
router.get("/amenities", parkController.getParksByAmenity);
router.get("/nearby", parkController.getParksNearLocation);
router.post("/favorites/:userId/:parkId", parkController.addParkToUserFavorites);
router.delete("/favorites/:userId/:parkId", parkController.removeParkFromUserFavorites);
router.post("/:parkId/check-in", parkController.checkInAtPark);
router.post("/:parkId/check-out", parkController.checkOutFromPark);
router.get("/:parkId/check-ins", parkController.getActiveCheckInsForPark);
router.get("/:id", parkController.getParkById);
router.put("/:id", parkController.updatePark);
router.delete("/:id", parkController.deletePark);
router.post("/", parkController.createPark);
router.get("/", parkController.getAllParks);

export default router;