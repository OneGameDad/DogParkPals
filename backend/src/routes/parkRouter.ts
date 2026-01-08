import express from "express";
import parkController from "../controllers/parkController";
// TODO: Import authentication middleware when implemented
// import { authenticate } from "../middleware/authenticate";

const router = express.Router();

// All routes require authentication (add authenticate middleware when available)
// TODO: Add authenticate middleware to all routes: router.use(authenticate)
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