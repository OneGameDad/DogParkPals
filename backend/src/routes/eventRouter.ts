import express from "express";
import eventController from "../controllers/eventController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = express.Router();

router.use(requireAuth);
router.get("/park/:parkId", eventController.getEventsByPark);
router.get("/organizer/:organizerId", eventController.getEventsByOrganizer);
router.get("/organization/:organizationId", eventController.getEventsByOrganization);
router.get("/upcoming", eventController.getUpcomingEvents);
router.get("/:eventId/is-event", eventController.isEvent);
router.post("/:eventId/attend", eventController.attendEvent);
router.delete("/:eventId/attend", eventController.cancelAttendance);
router.get("/:eventId/attendees", eventController.getEventAttendees);
router.delete("/:eventId/attendees", eventController.removeAllAttendees);
router.delete("/:eventId/attendees/user", eventController.removeAttendee);
router.get("/:eventId", eventController.getEventById);
router.put("/:eventId", eventController.updateEvent);
router.delete("/:eventId", eventController.deleteEvent);
router.post("/", eventController.createEvent);
router.get("/", eventController.getAllEvents);

export default router;