import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import type { Event } from '@prisma/client';
import { awardExperience, XP_REWARDS } from '../services/xpService';

// Mocks
const mockEventService = {
  createEvent: jest.fn() as jest.Mock<Promise<Event>>,
  updateEvent: jest.fn() as jest.Mock<Promise<Event>>,
  getEventById: jest.fn() as jest.Mock<Promise<Event | null>>,
  deleteEvent: jest.fn() as jest.Mock<Promise<void>>,
  getEventsByOrganizer: jest.fn() as jest.Mock<Promise<Event[]>>,
  getEventsByOrganization: jest.fn() as jest.Mock<Promise<Event[]>>,
  getEventsByPark: jest.fn() as jest.Mock<Promise<Event[]>>,
  getAllEvents: jest.fn() as jest.Mock<Promise<Event[]>>,
  getUpcomingEvents: jest.fn() as jest.Mock<Promise<Event[]>>,
  isEvent: jest.fn() as jest.Mock<Promise<boolean>>,
  attendEvent: jest.fn() as jest.Mock<Promise<void>>,
  cancelAttendance: jest.fn() as jest.Mock<Promise<void>>,
  getEventAttendees: jest.fn() as jest.Mock<Promise<any[]>>,
  removeAttendee: jest.fn() as jest.Mock<Promise<void>>,
  removeAllAttendees: jest.fn() as jest.Mock<Promise<void>>,
};

const mockOrganizationService = {
  getMember: jest.fn() as jest.Mock<Promise<any>>,
};

jest.mock('@prisma/client', () => {
  const mockPrismaClientKnownRequestError = class {
    code: string;
    constructor(code: string) {
      this.code = code;
    }
  };

  return {
    PrismaClient: jest.fn(() => ({
      event: {},
      organization: {},
      park: {},
      user: {},
      dog: {},
    })),
    AchievementType: {
      BADGE: 'BADGE',
      TROPHY: 'TROPHY',
      CERTIFICATE: 'CERTIFICATE',
    },
    Prisma: {
      PrismaClientKnownRequestError: mockPrismaClientKnownRequestError,
    },
  };
});

jest.mock('../services/eventService', () => ({
  __esModule: true,
  default: mockEventService,
}));

jest.mock('../services/organizationService', () => ({
  __esModule: true,
  default: mockOrganizationService,
}));

jest.mock('../utils/typeSafeLogger', () => ({
  __esModule: true,
  default: {
    logRequest: jest.fn(),
    logUserAction: jest.fn(),
    logError: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

const mockParseValidation = jest.fn();

jest.mock('../utils/validator', () => ({
  parseValidation: mockParseValidation,
}));

jest.mock('../services/xpService', () => ({
  awardExperience: jest.fn(),
  XP_REWARDS: {
    CREATE_EVENT: 5,
    JOIN_EVENT: 5,
  },
}));

// Use real toAppError helpers
import eventController from '../controllers/eventController';

// Test helpers
const makeRes = () => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res as Response;
};

const makeNext = () => jest.fn() as unknown as NextFunction;

const sampleEvent = {
  id: 1,
  title: 'Dog Park Playdate',
  description: 'A fun gathering',
  date: new Date('2026-01-10'),
  startTime: new Date('2026-01-10T10:00:00Z'),
  endTime: new Date('2026-01-10T12:00:00Z'),
  private: 'PUBLIC' as const,
  parkId: 1,
  organizerId: 123,
  createdAt: new Date('2025-12-01T00:00:00Z'),
  updatedAt: new Date('2025-12-01T00:00:00Z'),
};

describe('Event Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParseValidation.mockImplementation((schema, data) => data);
  });

  describe('createEvent', () => {
    test('creates event (PUBLIC) and returns 201', async () => {
      const req = {
        method: 'POST',
        path: '/events',
        body: {
          title: 'Dog Park Playdate',
          description: 'A fun gathering',
          date: new Date('2026-01-10'),
          startTime: new Date('2026-01-10T10:00:00Z'),
          endTime: new Date('2026-01-10T12:00:00Z'),
          parkId: 1,
          organizerId: 123,
          private: 'PUBLIC',
        },
      } as unknown as Request;
      const res = makeRes();
      const next = makeNext();

      mockEventService.createEvent.mockResolvedValue(sampleEvent);

      await eventController.createEvent(req, res, next);

      expect(mockEventService.createEvent).toHaveBeenCalledWith(
        'Dog Park Playdate',
        'A fun gathering',
        expect.any(Date),
        expect.any(Date),
        expect.any(Date),
        1,
        123,
        false,
        undefined,
      );
      expect(awardExperience).toHaveBeenCalledWith(123, XP_REWARDS.CREATE_EVENT, 'create_event');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(sampleEvent);
      expect(next).not.toHaveBeenCalled();
    });

    test('creates event (PRIVATE) maps to boolean true', async () => {
      const req = {
        method: 'POST',
        path: '/events',
        body: {
          title: 'Dog Park Playdate',
          description: 'A fun gathering',
          date: new Date('2026-01-10'),
          startTime: new Date('2026-01-10T10:00:00Z'),
          endTime: new Date('2026-01-10T12:00:00Z'),
          parkId: 1,
          organizerId: 123,
          private: 'PRIVATE',
        },
      } as unknown as Request;
      const res = makeRes();
      const next = makeNext();

      mockEventService.createEvent.mockResolvedValue({ ...sampleEvent, private: 'PRIVATE' });

      await eventController.createEvent(req, res, next);

      expect(mockEventService.createEvent).toHaveBeenCalledWith(
        'Dog Park Playdate',
        'A fun gathering',
        expect.any(Date),
        expect.any(Date),
        expect.any(Date),
        1,
        123,
        true,
        undefined,
      );
      expect(awardExperience).toHaveBeenCalledWith(123, XP_REWARDS.CREATE_EVENT, 'create_event');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(next).not.toHaveBeenCalled();
    });

    test('handles service error via next(toAppError)', async () => {
      const req = {
        method: 'POST',
        path: '/events',
        body: {
          title: 'Dog Park Playdate',
          description: 'A fun gathering',
          date: new Date('2026-01-10'),
          startTime: new Date('2026-01-10T10:00:00Z'),
          endTime: new Date('2026-01-10T12:00:00Z'),
          parkId: 1,
          organizerId: 123,
          private: 'PUBLIC',
        },
      } as unknown as Request;
      const res = makeRes();
      const next = makeNext();

      mockEventService.createEvent.mockRejectedValue(new Error('Database error'));

      await eventController.createEvent(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('validation error: short title', async () => {
      mockParseValidation.mockImplementationOnce(() => {
        throw new Error('Validation failed: short title');
      });

      const req = {
        method: 'POST',
        path: '/events',
        body: {
          title: 'a', // too short
          description: 'desc',
          date: new Date(Date.now() + 86400000),
          startTime: new Date(Date.now() + 90000000),
          endTime: new Date(Date.now() + 93600000),
          parkId: 1,
          organizerId: 123,
          private: 'PUBLIC',
        },
      } as unknown as Request;
      const res = makeRes();
      const next = makeNext();

      await eventController.createEvent(req, res, next);

      expect(mockEventService.createEvent).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    test('validation error: past date', async () => {
      mockParseValidation.mockImplementationOnce(() => {
        throw new Error('Validation failed: past date');
      });

      const req = {
        method: 'POST',
        path: '/events',
        body: {
          title: 'Valid Title',
          description: 'desc',
          date: new Date('2020-01-01'),
          startTime: new Date('2020-01-01T10:00:00Z'),
          endTime: new Date('2020-01-01T12:00:00Z'),
          parkId: 1,
          organizerId: 123,
          private: 'PUBLIC',
        },
      } as unknown as Request;
      const res = makeRes();
      const next = makeNext();

      await eventController.createEvent(req, res, next);

      expect(mockEventService.createEvent).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('updateEvent', () => {
    test('updates event when organizer matches', async () => {
      const req = {
        method: 'PATCH',
        path: '/events/1',
        params: { eventId: 1 } as any,
        body: { title: 'Updated Title' },
        user: { id: 123, role: 'MEMBER' },
      } as unknown as Request & { user: any };
      const res = makeRes();
      const next = makeNext();

      mockEventService.getEventById.mockResolvedValue(sampleEvent); // organizerId: 123
      mockEventService.updateEvent.mockResolvedValue({ ...sampleEvent, title: 'Updated Title' });

      await eventController.updateEvent(req, res, next);

      expect(mockEventService.updateEvent).toHaveBeenCalledWith(1, { title: 'Updated Title' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ title: 'Updated Title' }));
      expect(next).not.toHaveBeenCalled();
    });

    test('forbidden when not organizer and no org context', async () => {
      const req = {
        method: 'PATCH',
        path: '/events/1',
        params: { eventId: 1 } as any,
        body: { title: 'Updated Title' },
        user: { id: 999, role: 'MEMBER', organizationId: undefined },
      } as unknown as Request & { user: any };
      const res = makeRes();
      const next = makeNext();

      mockEventService.getEventById.mockResolvedValue({ ...sampleEvent, organizerId: 123 });

      await eventController.updateEvent(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('not found during authorization', async () => {
      const req = {
        method: 'PATCH',
        path: '/events/1',
        params: { eventId: 1 } as any,
        body: { title: 'Updated Title' },
        user: { id: 123, role: 'MEMBER' },
      } as unknown as Request & { user: any };
      const res = makeRes();
      const next = makeNext();

      mockEventService.getEventById.mockResolvedValue(null);

      await eventController.updateEvent(req, res, next);

      expect(mockEventService.updateEvent).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    test('forbidden when member role not sufficient', async () => {
      const req = {
        method: 'PATCH',
        path: '/events/1',
        params: { eventId: 1 } as any,
        body: { title: 'Updated Title' },
        user: { id: 999, role: 'MEMBER', organizationId: 5, organizationMember: { role: 'MEMBER' } },
      } as unknown as Request & { user: any };
      const res = makeRes();
      const next = makeNext();

      mockEventService.getEventById.mockResolvedValue({ ...sampleEvent, organizerId: 123, organizationId: 5 });

      await eventController.updateEvent(req, res, next);

      expect(mockEventService.updateEvent).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    test('service error bubbles via next', async () => {
      const req = {
        method: 'PATCH',
        path: '/events/1',
        params: { eventId: 1 } as any,
        body: { title: 'Updated Title' },
        user: { id: 123, role: 'MEMBER' },
      } as unknown as Request & { user: any };
      const res = makeRes();
      const next = makeNext();

      mockEventService.getEventById.mockResolvedValue(sampleEvent);
      mockEventService.updateEvent.mockRejectedValue(new Error('DB error'));

      await eventController.updateEvent(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('deleteEvent', () => {
    test('deletes event when organizer', async () => {
      const req = {
        method: 'DELETE',
        path: '/events/1',
        params: { eventId: 1 } as any,
        user: { id: 123, role: 'MEMBER' },
      } as unknown as Request & { user: any };
      const res = makeRes();
      const next = makeNext();

      mockEventService.getEventById.mockResolvedValue(sampleEvent);
      mockEventService.removeAllAttendees.mockResolvedValue(undefined);
      mockEventService.deleteEvent.mockResolvedValue(undefined);

      await eventController.deleteEvent(req, res, next);

      expect(mockEventService.removeAllAttendees).toHaveBeenCalledWith(1);
      expect(mockEventService.deleteEvent).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    test('forbidden when member role not sufficient', async () => {
      const req = {
        method: 'DELETE',
        path: '/events/1',
        params: { eventId: 1 } as any,
        user: { id: 999, role: 'MEMBER', organizationId: 5, organizationMember: { role: 'MEMBER' } },
      } as unknown as Request & { user: any };
      const res = makeRes();
      const next = makeNext();

      mockEventService.getEventById.mockResolvedValue({ ...sampleEvent, organizerId: 123, organizationId: 5 });

      await eventController.deleteEvent(req, res, next);

      expect(mockEventService.deleteEvent).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    test('service error bubbles via next', async () => {
      const req = {
        method: 'DELETE',
        path: '/events/1',
        params: { eventId: 1 } as any,
        user: { id: 123, role: 'MEMBER' },
      } as unknown as Request & { user: any };
      const res = makeRes();
      const next = makeNext();

      mockEventService.getEventById.mockResolvedValue(sampleEvent);
      mockEventService.removeAllAttendees.mockResolvedValue(undefined);
      mockEventService.deleteEvent.mockRejectedValue(new Error('DB error'));

      await eventController.deleteEvent(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('getEventById', () => {
    test('returns 200 with event when found', async () => {
      const req = { method: 'GET', path: '/events/1', params: { eventId: 1 } as any } as unknown as Request;
      const res = makeRes();
      const next = makeNext();

      mockEventService.getEventById.mockResolvedValue(sampleEvent);

      await eventController.getEventById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(sampleEvent);
      expect(next).not.toHaveBeenCalled();
    });

    test('calls next with NotFound when missing', async () => {
      const req = { method: 'GET', path: '/events/1', params: { eventId: 1 } as any } as unknown as Request;
      const res = makeRes();
      const next = makeNext();

      mockEventService.getEventById.mockResolvedValue(null);

      await eventController.getEventById(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('validation error: invalid eventId param', async () => {
      mockParseValidation.mockImplementationOnce(() => {
        throw new Error('Validation failed: eventId');
      });

      const req = { method: 'GET', path: '/events/abc', params: { eventId: 'abc' } as any } as unknown as Request;
      const res = makeRes();
      const next = makeNext();

      await eventController.getEventById(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(mockEventService.getEventById).not.toHaveBeenCalled();
    });
  });

  describe('lists', () => {
    test('getEventsByOrganizer returns 200', async () => {
      const req = { method: 'GET', path: '/organizers/123/events', params: { organizerId: 123 } as any } as unknown as Request;
      const res = makeRes();
      const next = makeNext();

      mockEventService.getEventsByOrganizer.mockResolvedValue([sampleEvent]);

      await eventController.getEventsByOrganizer(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([sampleEvent]);
      expect(next).not.toHaveBeenCalled();
    });

    test('getEventsByOrganization returns 200', async () => {
      const req = { method: 'GET', path: '/organizations/7/events', params: { organizationId: 7 } as any } as unknown as Request;
      const res = makeRes();
      const next = makeNext();

      mockEventService.getEventsByOrganization.mockResolvedValue([sampleEvent]);

      await eventController.getEventsByOrganization(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([sampleEvent]);
      expect(next).not.toHaveBeenCalled();
    });

    test('getEventsByPark returns 200', async () => {
      const req = { method: 'GET', path: '/parks/1/events', params: { parkId: 1 } as any } as unknown as Request;
      const res = makeRes();
      const next = makeNext();

      mockEventService.getEventsByPark.mockResolvedValue([sampleEvent]);

      await eventController.getEventsByPark(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([sampleEvent]);
      expect(next).not.toHaveBeenCalled();
    });

    test('getAllEvents returns 200', async () => {
      const req = { method: 'GET', path: '/events' } as unknown as Request;
      const res = makeRes();
      const next = makeNext();

      mockEventService.getAllEvents.mockResolvedValue([sampleEvent]);

      await eventController.getAllEvents(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([sampleEvent]);
      expect(next).not.toHaveBeenCalled();
    });

    test('getUpcomingEvents returns 200', async () => {
      const req = { method: 'GET', path: '/events/upcoming' } as unknown as Request;
      const res = makeRes();
      const next = makeNext();

      mockEventService.getUpcomingEvents.mockResolvedValue([sampleEvent]);

      await eventController.getUpcomingEvents(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([sampleEvent]);
      expect(next).not.toHaveBeenCalled();
    });

    test('getEventsByOrganizer validation error', async () => {
      mockParseValidation.mockImplementationOnce(() => {
        throw new Error('Validation failed: organizerId');
      });

      const req = { method: 'GET', path: '/organizers/abc/events', params: { organizerId: 'abc' } as any } as unknown as Request;
      const res = makeRes();
      const next = makeNext();

      await eventController.getEventsByOrganizer(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(mockEventService.getEventsByOrganizer).not.toHaveBeenCalled();
    });

    test('getEventsByOrganization validation error', async () => {
      mockParseValidation.mockImplementationOnce(() => {
        throw new Error('Validation failed: organizationId');
      });

      const req = { method: 'GET', path: '/organizations/abc/events', params: { organizationId: 'abc' } as any } as unknown as Request;
      const res = makeRes();
      const next = makeNext();

      await eventController.getEventsByOrganization(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(mockEventService.getEventsByOrganization).not.toHaveBeenCalled();
    });

    test('getEventsByPark validation error', async () => {
      mockParseValidation.mockImplementationOnce(() => {
        throw new Error('Validation failed: parkId');
      });

      const req = { method: 'GET', path: '/parks/abc/events', params: { parkId: 'abc' } as any } as unknown as Request;
      const res = makeRes();
      const next = makeNext();

      await eventController.getEventsByPark(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(mockEventService.getEventsByPark).not.toHaveBeenCalled();
    });

    test('getAllEvents service error via next', async () => {
      const req = { method: 'GET', path: '/events' } as unknown as Request;
      const res = makeRes();
      const next = makeNext();

      mockEventService.getAllEvents.mockRejectedValue(new Error('DB error'));

      await eventController.getAllEvents(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('getUpcomingEvents service error via next', async () => {
      const req = { method: 'GET', path: '/events/upcoming' } as unknown as Request;
      const res = makeRes();
      const next = makeNext();

      mockEventService.getUpcomingEvents.mockRejectedValue(new Error('DB error'));

      await eventController.getUpcomingEvents(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('isEvent', () => {
    test('returns exists true', async () => {
      const req = { method: 'GET', path: '/events/1/exists', params: { eventId: 1 } as any } as unknown as Request;
      const res = makeRes();
      const next = makeNext();

      mockEventService.isEvent.mockResolvedValue(true);

      await eventController.isEvent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ exists: true });
    });

    test('handles service error', async () => {
      const req = { method: 'GET', path: '/events/1/exists', params: { eventId: 1 } as any } as unknown as Request;
      const res = makeRes();
      const next = makeNext();

      mockEventService.isEvent.mockRejectedValue(new Error('Database error'));

      await eventController.isEvent(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('validation error: invalid eventId param', async () => {
      mockParseValidation.mockImplementationOnce(() => {
        throw new Error('Validation failed: eventId');
      });

      const req = { method: 'GET', path: '/events/abc/exists', params: { eventId: 'abc' } as any } as unknown as Request;
      const res = makeRes();
      const next = makeNext();

      await eventController.isEvent(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(mockEventService.isEvent).not.toHaveBeenCalled();
    });
  });

  describe('attendEvent', () => {
    test('allows public event without auth', async () => {
      const req = { method: 'POST', path: '/events/1/attend', params: { eventId: 1 } as any, user: { id: 123 } } as unknown as Request & { user: any };
      const res = makeRes();
      const next = makeNext();

      mockEventService.getEventById.mockResolvedValue({ ...sampleEvent, private: 'PUBLIC' });
      mockEventService.attendEvent.mockResolvedValue(undefined as any);

      await eventController.attendEvent(req, res, next);

      expect(mockEventService.attendEvent).toHaveBeenCalledWith(1, 123);
      expect(awardExperience).toHaveBeenCalledWith(123, XP_REWARDS.JOIN_EVENT, 'join_event');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    test('allows private event when organizer', async () => {
      const req = { method: 'POST', path: '/events/1/attend', params: { eventId: 1 } as any, user: { id: 123, role: 'MEMBER', organizationId: undefined } } as unknown as Request & { user: any };
      const res = makeRes();
      const next = makeNext();

      mockEventService.getEventById.mockResolvedValue({ ...sampleEvent, private: 'PRIVATE', organizerId: 123 });
      mockEventService.attendEvent.mockResolvedValue(undefined as any);

      await eventController.attendEvent(req, res, next);

      expect(mockEventService.attendEvent).toHaveBeenCalledWith(1, 123);
      expect(awardExperience).toHaveBeenCalledWith(123, XP_REWARDS.JOIN_EVENT, 'join_event');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    test('not found bubbles via next', async () => {
      const req = { method: 'POST', path: '/events/1/attend', params: { eventId: 1 } as any, user: { id: 123 } } as unknown as Request & { user: any };
      const res = makeRes();
      const next = makeNext();

      mockEventService.getEventById.mockResolvedValue(null);

      await eventController.attendEvent(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(mockEventService.attendEvent).not.toHaveBeenCalled();
    });
  });

  describe('cancelAttendance', () => {
    test('cancels when attending', async () => {
      const req = { method: 'DELETE', path: '/events/1/attend', params: { eventId: 1 } as any, user: { id: 123 } } as unknown as Request & { user: any };
      const res = makeRes();
      const next = makeNext();

      mockEventService.getEventById.mockResolvedValue(sampleEvent);
      mockEventService.getEventAttendees.mockResolvedValue([{ id: 123 }]);
      mockEventService.cancelAttendance.mockResolvedValue(undefined as any);

      await eventController.cancelAttendance(req, res, next);

      expect(mockEventService.cancelAttendance).toHaveBeenCalledWith(1, 123);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    test('throws conflict when not attending', async () => {
      const req = { method: 'DELETE', path: '/events/1/attend', params: { eventId: 1 } as any, user: { id: 123 } } as unknown as Request & { user: any };
      const res = makeRes();
      const next = makeNext();

      mockEventService.getEventById.mockResolvedValue(sampleEvent);
      mockEventService.getEventAttendees.mockResolvedValue([{ id: 999 }]);

      await eventController.cancelAttendance(req, res, next);

      expect(mockEventService.cancelAttendance).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getEventAttendees', () => {
    test('returns attendees for public event', async () => {
      const req = { method: 'GET', path: '/events/1/attendees', params: { eventId: 1 } as any, user: { id: 999 } } as unknown as Request & { user: any };
      const res = makeRes();
      const next = makeNext();

      mockEventService.isEvent.mockResolvedValue(true);
      mockEventService.getEventById.mockResolvedValue({ ...sampleEvent, private: 'PUBLIC' });
      mockEventService.getEventAttendees.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      await eventController.getEventAttendees(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
      expect(next).not.toHaveBeenCalled();
    });

    test('returns attendees for private event when organizer', async () => {
      const req = { method: 'GET', path: '/events/1/attendees', params: { eventId: 1 } as any, user: { id: 123, role: 'MEMBER' } } as unknown as Request & { user: any };
      const res = makeRes();
      const next = makeNext();

      mockEventService.isEvent.mockResolvedValue(true);
      mockEventService.getEventById.mockResolvedValue({ ...sampleEvent, private: 'PRIVATE', organizerId: 123 });
      mockEventService.getEventAttendees.mockResolvedValue([{ id: 1 }]);

      await eventController.getEventAttendees(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('removeAttendee', () => {
    test('removes attendee when organizer', async () => {
      const req = {
        method: 'DELETE',
        path: '/events/1/attendees',
        params: { eventId: 1 } as any,
        body: { userId: 456 },
        user: { id: 123, role: 'MEMBER' },
      } as unknown as Request & { user: any };
      const res = makeRes();
      const next = makeNext();

      mockEventService.getEventById.mockResolvedValue({ ...sampleEvent, organizerId: 123 });
      mockEventService.getEventAttendees.mockResolvedValue([{ id: 456 }]);
      mockEventService.removeAttendee.mockResolvedValue(undefined);

      await eventController.removeAttendee(req, res, next);

      expect(mockEventService.removeAttendee).toHaveBeenCalledWith(1, 456);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Attendee removed successfully' });
      expect(next).not.toHaveBeenCalled();
    });

    test('removes attendee when admin', async () => {
      const req = {
        method: 'DELETE',
        path: '/events/1/attendees',
        params: { eventId: 1 } as any,
        body: { userId: 456 },
        user: { id: 999, role: 'ADMIN' },
      } as unknown as Request & { user: any };
      const res = makeRes();
      const next = makeNext();

      mockEventService.getEventById.mockResolvedValue({ ...sampleEvent, organizerId: 123 });
      mockEventService.getEventAttendees.mockResolvedValue([{ id: 456 }]);
      mockEventService.removeAttendee.mockResolvedValue(undefined);

      await eventController.removeAttendee(req, res, next);

      expect(mockEventService.removeAttendee).toHaveBeenCalledWith(1, 456);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    test('removes attendee when organization moderator', async () => {
      const req = {
        method: 'DELETE',
        path: '/events/1/attendees',
        params: { eventId: 1 } as any,
        body: { userId: 456 },
        user: { id: 999, role: 'MEMBER', organizationId: 5, organizationMember: { role: 'MODERATOR' } },
      } as unknown as Request & { user: any };
      const res = makeRes();
      const next = makeNext();

      mockEventService.getEventById.mockResolvedValue({ ...sampleEvent, organizerId: 123, organizationId: 5 });
      mockEventService.getEventAttendees.mockResolvedValue([{ id: 456 }]);
      mockEventService.removeAttendee.mockResolvedValue(undefined);

      await eventController.removeAttendee(req, res, next);

      expect(mockEventService.removeAttendee).toHaveBeenCalledWith(1, 456);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    test('removes attendee when organization owner', async () => {
      const req = {
        method: 'DELETE',
        path: '/events/1/attendees',
        params: { eventId: 1 } as any,
        body: { userId: 456 },
        user: { id: 999, role: 'MEMBER', organizationId: 5, organizationMember: { role: 'OWNER' } },
      } as unknown as Request & { user: any };
      const res = makeRes();
      const next = makeNext();

      mockEventService.getEventById.mockResolvedValue({ ...sampleEvent, organizerId: 123, organizationId: 5 });
      mockEventService.getEventAttendees.mockResolvedValue([{ id: 456 }]);
      mockEventService.removeAttendee.mockResolvedValue(undefined);

      await eventController.removeAttendee(req, res, next);

      expect(mockEventService.removeAttendee).toHaveBeenCalledWith(1, 456);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    test('throws conflict when user not attending', async () => {
      const req = {
        method: 'DELETE',
        path: '/events/1/attendees',
        params: { eventId: 1 } as any,
        body: { userId: 456 },
        user: { id: 123, role: 'MEMBER' },
      } as unknown as Request & { user: any };
      const res = makeRes();
      const next = makeNext();

      mockEventService.getEventById.mockResolvedValue({ ...sampleEvent, organizerId: 123 });
      mockEventService.getEventAttendees.mockResolvedValue([{ id: 789 }]);

      await eventController.removeAttendee(req, res, next);

      expect(mockEventService.removeAttendee).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    test('throws not found when event missing', async () => {
      const req = {
        method: 'DELETE',
        path: '/events/1/attendees',
        params: { eventId: 1 } as any,
        body: { userId: 456 },
        user: { id: 123, role: 'MEMBER' },
      } as unknown as Request & { user: any };
      const res = makeRes();
      const next = makeNext();

      mockEventService.getEventById.mockResolvedValue(null);

      await eventController.removeAttendee(req, res, next);

      expect(mockEventService.removeAttendee).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    test('throws forbidden when not authorized', async () => {
      const req = {
        method: 'DELETE',
        path: '/events/1/attendees',
        params: { eventId: 1 } as any,
        body: { userId: 456 },
        user: { id: 999, role: 'MEMBER', organizationId: undefined },
      } as unknown as Request & { user: any };
      const res = makeRes();
      const next = makeNext();

      mockEventService.getEventById.mockResolvedValue({ ...sampleEvent, organizerId: 123 });
      mockEventService.getEventAttendees.mockResolvedValue([{ id: 456 }]);

      await eventController.removeAttendee(req, res, next);

      expect(mockEventService.removeAttendee).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });
});
