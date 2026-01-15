import express from "express";
import parkController from "../controllers/parkController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = express.Router();

router.use(requireAuth);
router.get("/parks/name/:name", parkController.getParkByName);
router.get("/parks/amenities", parkController.getParksByAmenity);
router.get("/parks/nearby", parkController.getParksNearLocation);
router.get("/parks/:id", parkController.getParkById);
router.get("/parks", parkController.getAllParks);
router.post("/parks", parkController.createPark);
router.post("/parks/favorites/:userId/:parkId", parkController.addParkToUserFavorites);
router.put("/parks/:id", parkController.updatePark);
router.delete("/parks/favorites/:userId/:parkId", parkController.removeParkFromUserFavorites);
router.delete("/parks/:id", parkController.deletePark);
router.post("/parks/:parkId/check-in", parkController.checkInAtPark);
router.post("/parks/:parkId/check-out", parkController.checkOutFromPark);
router.get("/parks/:parkId/check-ins", parkController.getActiveCheckInsForPark);

export default router;