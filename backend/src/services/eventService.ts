import { PrismaClient, Prisma } from '@prisma/client';
import type { NotificationType } from '@prisma/client';
import typeSafeLogger from '../utils/typeSafeLogger';
import { toAppError } from '../utils/errors';
import notificationService from './notificationService';
import {
  createEventSchema,
  updateEventSchema,
  getEventByIdSchema,
  deleteEventSchema,
  getEventsByOrganizerSchema,
  getEventsByOrganizationSchema,
  getEventsByParkSchema,
} from '../utils/validationSchemas';

const prisma = new PrismaClient();

const eventService = {
  async createEvent(
    title: string,
    description: string | undefined,
    date: Date,
    startTime: Date,
    endTime: Date,
    parkId: number,
    organizerId: number,
    isPrivate?: boolean,
    organizationId?: number
  ) {
    typeSafeLogger.logUserAction('Creating event', { title, organizerId });
    try {
      const validated = createEventSchema.parse({ 
        title, 
        description, 
        date, 
        startTime,
        endTime,
        parkId, 
        organizerId, 
        organizationId,
        private: isPrivate ? 'PRIVATE' : 'PUBLIC'
      });
      const newEvent = await prisma.event.create({
        data: {
          title: validated.title,
          description: validated.description,
          date: validated.date,
          startTime: validated.startTime,
          endTime: validated.endTime,
          parkId: validated.parkId,
          organizerId: validated.organizerId,
          organizationId: validated.organizationId,
          private: validated.private,
        },
      });
      const favoriteUsers = await prisma.userFavoritePark.findMany({
        where: { parkId: newEvent.parkId },
        select: { userId: true },
      });
      const orgMembers = newEvent.organizationId
        ? await prisma.organizationMember.findMany({
            where: { organizationId: newEvent.organizationId },
            select: { userId: true },
          })
        : [];
      const recipientIds = [
        ...favoriteUsers.map((favorite) => favorite.userId),
        ...orgMembers.map((member) => member.userId),
      ].filter((userId) => userId !== newEvent.organizerId);
      await notificationService.createNotifications(recipientIds, 'EVENT_CREATED' as NotificationType, {
        eventId: newEvent.id,
        parkId: newEvent.parkId,
        organizationId: newEvent.organizationId,
        title: newEvent.title,
      });
      typeSafeLogger.logUserAction('Event created successfully', { eventId: newEvent.id, title });
      return newEvent;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to create event',
        code: 'CREATE_EVENT_FAILED',
      });
      typeSafeLogger.logError('Failed to create event', appError, { title, organizerId });
      throw appError;
    }
  },

  async updateEvent(
    eventId: number,
    updateData: Prisma.EventUpdateInput
  ) {
    typeSafeLogger.logUserAction('Updating event', { eventId });
    try {
      const validated = updateEventSchema.parse(updateData);
      const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: validated,
      });
      typeSafeLogger.logUserAction('Event updated successfully', { eventId });
      return updatedEvent;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to update event',
        code: 'UPDATE_EVENT_FAILED',
      });
      typeSafeLogger.logError('Failed to update event', appError, { eventId });
      throw appError;
    }
  },

  async getEventById(eventId: number) {
    typeSafeLogger.info('Fetching event by ID', { eventId });
    try {
      const validated = getEventByIdSchema.parse({ eventId });
      const event = await prisma.event.findUnique({
        where: { id: validated.eventId },
      });
      if (event) {
        typeSafeLogger.logUserAction('Event found by ID', { eventId });
      } else {
        typeSafeLogger.warn('Event not found by ID', { eventId });
      }
      return event;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch event by ID',
        code: 'FETCH_EVENT_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch event by ID', appError, { eventId });
      throw appError;
    }
  },
  
  async deleteEvent(eventId: number) {
    typeSafeLogger.logUserAction('Deleting event', { eventId });
    try {
      const validated = deleteEventSchema.parse({ eventId });
      await prisma.event.delete({
        where: { id: validated.eventId },
      });
      typeSafeLogger.logUserAction('Event deleted successfully', { eventId });
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to delete event',
        code: 'DELETE_EVENT_FAILED',
      });
      typeSafeLogger.logError('Failed to delete event', appError, { eventId });
      throw appError;
    }
  },

  async getEventsByOrganizer(organizerId: number) {
    typeSafeLogger.info('Fetching events by organizer', { organizerId });
    try {
      const validated = getEventsByOrganizerSchema.parse({ organizerId });
      const events = await prisma.event.findMany({
        where: { organizerId: validated.organizerId },
      });
      typeSafeLogger.logUserAction('Events fetched by organizer', { organizerId, eventCount: events.length });
      return events;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch events by organizer',
        code: 'FETCH_EVENTS_BY_ORGANIZER_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch events by organizer', appError, { organizerId });
      throw appError;
    }
  },

  async getAllEvents() {
    typeSafeLogger.info('Fetching all events');
    try {
      const events = await prisma.event.findMany();
      typeSafeLogger.logUserAction('All events fetched', { eventCount: events.length });
      return events;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch all events',
        code: 'FETCH_ALL_EVENTS_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch all events', appError);
      throw appError;
    }
  },

  async getEventsByOrganization(organizationId: number) {
    typeSafeLogger.info('Fetching events by organization', { organizationId });
    try {
      const validated = getEventsByOrganizationSchema.parse({ organizationId });
      const events = await prisma.event.findMany({
        where: { organizationId: validated.organizationId },
      });
      typeSafeLogger.logUserAction('Events fetched by organization', { organizationId, eventCount: events.length });
      return events;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch events by organization',
        code: 'FETCH_EVENTS_BY_ORGANIZATION_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch events by organization', appError, { organizationId });
      throw appError;
    }
  },

  async getUpcomingEvents() {
    typeSafeLogger.info('Fetching upcoming events');
    try {
      const now = new Date();
      const events = await prisma.event.findMany({
        where: { date: { gt: now } },
        orderBy: { date: 'asc' },
      });
      typeSafeLogger.logUserAction('Upcoming events fetched', { eventCount: events.length });
      return events;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch upcoming events',
        code: 'FETCH_UPCOMING_EVENTS_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch upcoming events', appError);
      throw appError;
    }
  },

  async getEventsByPark(parkId: number) {
    typeSafeLogger.info('Fetching events by park', { parkId });
    try {
      const validated = getEventsByParkSchema.parse({ parkId });
      const events = await prisma.event.findMany({
        where: { parkId: validated.parkId },
      });
      typeSafeLogger.logUserAction('Events fetched by park', { parkId, eventCount: events.length });
      return events;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch events by park',
        code: 'FETCH_EVENTS_BY_PARK_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch events by park', appError, { parkId });
      throw appError;
    }
  },
  
  async isEvent(eventId: number): Promise<boolean> {
    typeSafeLogger.info('Checking if event exists', { eventId });
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });
      const exists = !!event;
      typeSafeLogger.logUserAction('Event existence checked', { eventId, exists });
      return exists;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to check if event exists',
        code: 'CHECK_EVENT_EXISTENCE_FAILED',
      });
      typeSafeLogger.logError('Failed to check if event exists', appError, { eventId });
      throw appError;
    }
  },

  async attendEvent(eventId: number, userId: number) {
    typeSafeLogger.logUserAction('Attending event', { eventId, userId });
    try {
      const attendance = await prisma.eventAttendance.create({
        data: {
          eventId,
          userId,
        },
      });
      typeSafeLogger.logUserAction('Attending event successful', { eventId, userId });
      return attendance;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to attend event',
        code: 'ATTEND_EVENT_FAILED',
      });
      typeSafeLogger.logError('Failed to attend event', appError, { eventId, userId });
      throw appError;
    }
  },

  async cancelAttendance(eventId: number, userId: number) {
    typeSafeLogger.logUserAction('Cancelling attendance to event', { eventId, userId });
    try {
      await prisma.eventAttendance.deleteMany({
        where: {
          eventId,
          userId,
        },
      });
      typeSafeLogger.logUserAction('Attendance to event cancelled', { eventId, userId });
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to cancel attendance to event',
        code: 'CANCEL_ATTENDANCE_EVENT_FAILED',
      });
      typeSafeLogger.logError('Failed to cancel attendance to event', appError, { eventId, userId });
      throw appError;
    }
  },

  async getEventAttendees(eventId: number) {
    typeSafeLogger.info('Fetching event attendees', { eventId });
    try {
      const attendees = await prisma.eventAttendance.findMany({
        where: { eventId },
        include: { user: true },
      });
      typeSafeLogger.logUserAction('Event attendees fetched', { eventId, attendeeCount: attendees.length });
      return attendees.map(att => att.user);
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch event attendees',
        code: 'FETCH_EVENT_ATTENDEES_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch event attendees', appError, { eventId });
      throw appError;
    }
  },
  
  async removeAttendee(eventId: number, userId: number) {
    typeSafeLogger.logUserAction('Removing attendee from event', { eventId, userId });
    try {
      await prisma.eventAttendance.deleteMany({
        where: {
          eventId,
          userId,
        },
      });
      typeSafeLogger.logUserAction('Attendee removed from event', { eventId, userId });
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to remove attendee from event',
        code: 'REMOVE_EVENT_ATTENDEE_FAILED',
      });
      typeSafeLogger.logError('Failed to remove attendee from event', appError, { eventId, userId });
      throw appError;
    }
  },

  async removeAllAttendees(eventId: number) {
    typeSafeLogger.logUserAction('Removing all attendees from event', { eventId });
    try {
      await prisma.eventAttendance.deleteMany({
        where: {
          eventId,
        },
      });
      typeSafeLogger.logUserAction('All attendees removed from event', { eventId });
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to remove all attendees from event',
        code: 'REMOVE_ALL_EVENT_ATTENDEES_FAILED',
      });
      typeSafeLogger.logError('Failed to remove all attendees from event', appError, { eventId });
      throw appError;
    }
  },
};

export default eventService;