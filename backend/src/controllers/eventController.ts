import { Request, Response, NextFunction } from "express";
import eventService from "../services/eventService";
import typeSafeLogger from "../utils/typeSafeLogger";
import { toAppError, ConflictError, NotFoundError, ForbiddenError, isAppError } from "../utils/errors";
import { parseValidation } from "../utils/validator";
import organizationService from "../services/organizationService";
import type { Event } from "@prisma/client";
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

  // Must have an organization context if not organizer/admin
  if (!organizationId) {
    throw ForbiddenError("Not authorized to modify this event");
  }

  // Prefer provided organizationMember; otherwise fetch
  const member = organizationMember ?? (await organizationService.getMember(organizationId, userId));
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
        isPrivate === 'PRIVATE'
      );

      typeSafeLogger.logUserAction("Event created", { eventId: newEvent.id, title });
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
        req.user.id,
        req.user.role,
        req.user.organizationId,
        req.user.organizationMember
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
        req.user.id,
        req.user.role,
        req.user.organizationId,
        req.user.organizationMember
      );

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
  }
};

export default eventController;