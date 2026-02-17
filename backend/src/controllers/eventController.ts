import { Request, Response, NextFunction } from "express";
import eventService from "../services/eventService";
import typeSafeLogger from "../utils/typeSafeLogger";
import { toAppError, ConflictError, NotFoundError, ForbiddenError, isAppError } from "../utils/errors";
import { parseValidation } from "../utils/validator";
import organizationService from "../services/organizationService";
import type { Event } from "@prisma/client";
import { awardAchievement, awardExperience, XP_REWARDS } from "../services/xpService";
import { AchievementType } from "@prisma/client";
import {
  createEventSchema,
  updateEventSchema,
  getEventByIdSchema,
  deleteEventSchema,
  getEventsByOrganizerSchema,
  getEventsByOrganizationSchema,
  getEventsByParkSchema,
} from '../utils/validationSchemas';

// Authorization: organizer OR system admin/developer OR org member with OWNER/MODERATOR
async function checkEventAuthorization(
  eventId: number,
  userId: number,
  userRole: string | undefined,
  organizationId: number | undefined,
  organizationMember: any
): Promise<Event> {
  const event = await eventService.getEventById(eventId);
  if (!event) {
    throw NotFoundError("Event not found");
  }

  // Organizer always allowed
  if (event.organizerId === userId) {
    return event;
  }

  // System-level roles
  const isAdmin = userRole === "ADMIN" || userRole === "DEVELOPER";
  if (isAdmin) {
    return event;
  }

  // If event has no organization, only organizer/admin can modify
  if (!event.organizationId) {
    throw ForbiddenError("Not authorized to modify this event");
  }

  // Check if user is a member of the event's organization
  const member = organizationMember ?? (await organizationService.getMember(event.organizationId, userId));
  const isOwnerOrModerator = !!member && (member.role === "OWNER" || member.role === "MODERATOR");
  if (!isOwnerOrModerator) {
    throw ForbiddenError("Not authorized to modify this event");
  }

  return event;
}

const eventController = {
  createEvent: async (req: Request, res: Response, next: NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to create event", { method: req.method, path: req.path });
      const {
        title,
        description,
        date,
        startTime,
        endTime,
        parkId,
        organizationId,
        organizerId,
        private: isPrivate,
      } = parseValidation(createEventSchema, req.body);

      const newEvent = await eventService.createEvent(
        title,
        description,
        date,
        startTime,
        endTime,
        parkId,
        organizerId,
        isPrivate === 'PRIVATE',
        organizationId
      );

      typeSafeLogger.logUserAction("Event created", { eventId: newEvent.id, title });
      await awardExperience(organizerId, XP_REWARDS.CREATE_EVENT, 'create_event');
      res.status(201).json(newEvent);
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(
        toAppError(error, { message: "Failed to create event", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },

  updateEvent: async (req: Request, res: Response, next: NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to update event", { method: req.method, path: req.path });
      const { eventId } = parseValidation(getEventByIdSchema, req.params);
      const updateData = parseValidation(updateEventSchema, req.body);

      await checkEventAuthorization(
        eventId,
        req.user!.id,
        req.user!.role,
        req.user!.organizationId,
        req.user!.organizationMember
      );

      const updatedEvent = await eventService.updateEvent(eventId, updateData);

      typeSafeLogger.logUserAction("Event updated", { eventId });
      res.status(200).json(updatedEvent);
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(
        toAppError(error, { message: "Failed to update event", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },

  deleteEvent: async (req: Request, res: Response, next: NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to delete event", { method: req.method, path: req.path });
      const { eventId } = parseValidation(deleteEventSchema, req.params);

      await checkEventAuthorization(
        eventId,
        req.user!.id,
        req.user!.role,
        req.user!.organizationId,
        req.user!.organizationMember
      );

      await eventService.removeAllAttendees(eventId);
      await eventService.deleteEvent(eventId);

      typeSafeLogger.logUserAction("Event deleted", { eventId });
      res.status(204).send();
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(
        toAppError(error, { message: "Failed to delete event", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },

  getEventById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to fetch event by ID", { method: req.method, path: req.path });
      const { eventId } = parseValidation(getEventByIdSchema, req.params);

      const event = await eventService.getEventById(eventId);
      if (!event) {
        throw NotFoundError("Event not found");
      }

      typeSafeLogger.logUserAction("Event retrieved", { eventId });
      res.status(200).json(event);
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(
        toAppError(error, { message: "Failed to retrieve event", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },

  getEventsByOrganizer: async (req: Request, res: Response, next: NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to fetch events by organizer", { method: req.method, path: req.path });
      const { organizerId } = parseValidation(getEventsByOrganizerSchema, req.params);

      const events = await eventService.getEventsByOrganizer(organizerId);

      typeSafeLogger.logUserAction("Events retrieved by organizer", { organizerId, eventCount: events.length });
      res.status(200).json(events);
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(
        toAppError(error, { message: "Failed to retrieve events", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },

  getEventsByOrganization: async (req: Request, res: Response, next: NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to fetch events by organization", { method: req.method, path: req.path });
      const { organizationId } = parseValidation(getEventsByOrganizationSchema, req.params);

      const events = await eventService.getEventsByOrganization(organizationId);

      typeSafeLogger.logUserAction("Events retrieved by organization", { organizationId, eventCount: events.length });
      res.status(200).json(events);
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(
        toAppError(error, { message: "Failed to retrieve events", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },
  
  getEventsByPark: async (req: Request, res: Response, next: NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to fetch events by park", { method: req.method, path: req.path });
      const { parkId } = parseValidation(getEventsByParkSchema, req.params);
        const events = await eventService.getEventsByPark(parkId);
        typeSafeLogger.logUserAction("Events retrieved by park", { parkId, eventCount: events.length });
        res.status(200).json(events);
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(
        toAppError(error, { message: "Failed to retrieve events", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },
  
  getAllEvents: async (req: Request, res: Response, next: NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to fetch all events", { method: req.method, path: req.path });
        const events = await eventService.getAllEvents();
        typeSafeLogger.logUserAction("All events retrieved", { eventCount: events.length });
        res.status(200).json(events);
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(
        toAppError(error, { message: "Failed to retrieve events", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },

  getUpcomingEvents: async (req: Request, res: Response, next: NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to fetch upcoming events", { method: req.method, path: req.path });
        const events = await eventService.getUpcomingEvents();
        typeSafeLogger.logUserAction("Upcoming events retrieved", { eventCount: events.length });
        res.status(200).json(events);
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(
        toAppError(error, { message: "Failed to retrieve upcoming events", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },

  isEvent: async (req: Request, res: Response, next: NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to check if event exists", { method: req.method, path: req.path });
      const { eventId } = parseValidation(getEventByIdSchema, req.params);

      const exists = await eventService.isEvent(eventId);

      typeSafeLogger.logUserAction("Event existence checked", { eventId, exists });
      res.status(200).json({ exists });
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(
        toAppError(error, { message: "Failed to check event existence", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },

  attendEvent: async (req: Request, res: Response, next: NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to attend event", { method: req.method, path: req.path });
      const { eventId } = parseValidation(getEventByIdSchema, req.params);
      const userId = req.user!.id;

      //check if event is public/private and if user is allowed to join
      const event = await eventService.getEventById(eventId);
      if (!event) {
        throw NotFoundError("Event not found");
      }
      if (event.private === "PUBLIC") {
        // public event, anyone can join
        await eventService.attendEvent(eventId, userId);

        typeSafeLogger.logUserAction("User attended event", { eventId, userId });
        await awardExperience(userId, XP_REWARDS.JOIN_EVENT, 'join_event');
        await awardAchievement(userId, "Pup Pal", AchievementType.BADGE);
        res.status(200).json({ message: "Attended event successfully" });
        return;
      }

      await checkEventAuthorization(
        eventId,
        userId,
        req.user!.role,
        req.user!.organizationId,
        req.user!.organizationMember
      );

      await eventService.attendEvent(eventId, userId);

      typeSafeLogger.logUserAction("User attended event", { eventId, userId });
      await awardExperience(userId, XP_REWARDS.JOIN_EVENT, 'join_event');
      await awardAchievement(userId, "Pup Pal", AchievementType.BADGE);
      res.status(200).json({ message: "Attended event successfully" });
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(
        toAppError(error, { message: "Failed to attend event", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },

  cancelAttendance: async (req: Request, res: Response, next: NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to cancel attendance", { method: req.method, path: req.path });
      const { eventId } = parseValidation(getEventByIdSchema, req.params);
      const userId = req.user!.id;
      //check user is attending the event
      const event = await eventService.getEventById(eventId);
      if (!event) {
        throw NotFoundError("Event not found");
      }
      const attendees = await eventService.getEventAttendees(eventId);
      const isAttending = attendees.some((attendee) => attendee.id === userId);
      if (!isAttending) {
        throw ConflictError("User is not attending the event");
      }
      await eventService.cancelAttendance(eventId, userId);

      typeSafeLogger.logUserAction("User canceled attendance", { eventId, userId });
      res.status(200).json({ message: "Canceled attendance successfully" });
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(
        toAppError(error, { message: "Failed to cancel attendance", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },

  getEventAttendees: async (req: Request, res: Response, next: NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to fetch event attendees", { method: req.method, path: req.path });
      const { eventId } = parseValidation(getEventByIdSchema, req.params);

      if (!await eventService.isEvent(eventId)) {
        throw NotFoundError("Event not found");
      }

      const event = await eventService.getEventById(eventId);
      if (event!.private === "PUBLIC") {
        // public event, anyone can view attendees
        const attendees = await eventService.getEventAttendees(eventId);

        typeSafeLogger.logUserAction("Event attendees retrieved", { eventId, attendeeCount: attendees.length });
        res.status(200).json(attendees);
        return;
      }

      await checkEventAuthorization(
        eventId,
        req.user!.id,
        req.user!.role,
        req.user!.organizationId,
        req.user!.organizationMember
      );

      const attendees = await eventService.getEventAttendees(eventId);

      typeSafeLogger.logUserAction("Event attendees retrieved", { eventId, attendeeCount: attendees.length });
      res.status(200).json(attendees);
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(
        toAppError(error, { message: "Failed to retrieve event attendees", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },

  removeAttendee: async (req: Request, res: Response, next: NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to remove attendee from event", { method: req.method, path: req.path });
      const { eventId } = parseValidation(getEventByIdSchema, req.params);
      const { userId } = req.body;
      // check event exists and target user is attending
      const event = await eventService.getEventById(eventId);
      if (!event) {
        throw NotFoundError("Event not found");
      }
      const attendees = await eventService.getEventAttendees(eventId);
      const isAttending = attendees.some((attendee) => attendee.id === userId);
      if (!isAttending) {
        throw ConflictError("User is not attending the event");
      }
    // authorization check - organizer/admin/org mod/owner
      await checkEventAuthorization(
        eventId,
        req.user!.id,
        req.user!.role,
        req.user!.organizationId,
        req.user!.organizationMember
      );

      await eventService.removeAttendee(eventId, userId);

      typeSafeLogger.logUserAction("Attendee removed from event", { eventId, userId });
      res.status(200).json({ message: "Attendee removed successfully" });
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(
        toAppError(error, { message: "Failed to remove attendee", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },

  removeAllAttendees: async (req: Request, res: Response, next: NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to remove all attendees from event", { method: req.method, path: req.path });
      const { eventId } = parseValidation(getEventByIdSchema, req.params);

      await checkEventAuthorization(
        eventId,
        req.user!.id,
        req.user!.role,
        req.user!.organizationId,
        req.user!.organizationMember
      );

      await eventService.removeAllAttendees(eventId);

      typeSafeLogger.logUserAction("All attendees removed from event", { eventId });
      res.status(200).json({ message: "All attendees removed successfully" });
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(
        toAppError(error, { message: "Failed to remove all attendees", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },

};

export default eventController;