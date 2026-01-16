import express from "express";
import eventController from "../controllers/eventController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = express.Router();

router.use(requireAuth);
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