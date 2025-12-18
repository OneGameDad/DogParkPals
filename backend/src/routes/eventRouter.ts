import express from "express";
import eventController from "../controllers/eventController";
// TODO: Import authentication middleware when implemented
// import { authenticate } from "../middleware/authenticate";

const router = express.Router();

// All routes require authentication (add authenticate middleware when available)
// TODO: Add authenticate middleware to all routes: router.use(authenticate)
router.post("/events", eventController.createEvent);
router.get("/events/park/:parkId", eventController.getEventsByPark);
router.get("/events/organizer/:organizerId", eventController.getEventsByOrganizer);
router.get("/events/organization/:organizationId", eventController.getEventsByOrganization);
router.get("/events/upcoming", eventController.getUpcomingEvents);
router.get("/events/:eventId/is-event", eventController.isEvent);
router.get("/events/:eventId", eventController.getEventById);
router.put("/events/:eventId", eventController.updateEvent);
router.delete("/events/:eventId", eventController.deleteEvent);
router.get("/events", eventController.getAllEvents);

export default router;