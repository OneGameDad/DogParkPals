import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction, Express } from 'express';
import express from 'express';
import request from 'supertest';
import type { Event } from '@prisma/client';

// Mock the auth middleware before importing the router
jest.mock('../middlewares/authMiddleware', () => ({
  requireAuth: (req: Request, res: Response, next: NextFunction) => {
    (req as any).userId = 1;
    next();
  },
}));

// Create mock controller functions
const mockCreateEvent = jest.fn() as any;
const mockUpdateEvent = jest.fn() as any;
const mockDeleteEvent = jest.fn() as any;
const mockGetEventById = jest.fn() as any;
const mockGetEventsByOrganizer = jest.fn() as any;
const mockGetEventsByOrganization = jest.fn() as any;
const mockGetEventsByPark = jest.fn() as any;
const mockGetAllEvents = jest.fn() as any;
const mockGetUpcomingEvents = jest.fn() as any;
const mockIsEvent = jest.fn() as any;
const mockAttendEvent = jest.fn() as any;
const mockCancelAttendance = jest.fn() as any;
const mockGetEventAttendees = jest.fn() as any;
const mockRemoveAllAttendees = jest.fn() as any;
const mockRemoveAttendee = jest.fn() as any;

// Mock the controller
jest.mock('../controllers/eventController', () => ({
  __esModule: true,
  default: {
    createEvent: mockCreateEvent,
    updateEvent: mockUpdateEvent,
    deleteEvent: mockDeleteEvent,
    getEventById: mockGetEventById,
    getEventsByOrganizer: mockGetEventsByOrganizer,
    getEventsByOrganization: mockGetEventsByOrganization,
    getEventsByPark: mockGetEventsByPark,
    getAllEvents: mockGetAllEvents,
    getUpcomingEvents: mockGetUpcomingEvents,
    isEvent: mockIsEvent,
    attendEvent: mockAttendEvent,
    cancelAttendance: mockCancelAttendance,
    getEventAttendees: mockGetEventAttendees,
    removeAllAttendees: mockRemoveAllAttendees,
    removeAttendee: mockRemoveAttendee,
  },
}));

// Import router after mocks are set up
import eventRouter from '../routes/eventRouter';

describe('Event Router', () => {
  let app: Express;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use(eventRouter);
  });

  const sampleEvent: Event = {
    id: 1,
    title: 'Dog Park Playdate',
    description: 'A fun gathering',
    date: new Date('2026-01-10'),
    startTime: new Date('2026-01-10T10:00:00Z'),
    endTime: new Date('2026-01-10T12:00:00Z'),
    private: 'PUBLIC',
    parkId: 1,
    organizerId: 123,
    createdAt: new Date('2025-12-01T00:00:00Z'),
    updatedAt: new Date('2025-12-01T00:00:00Z'),
  };

  describe('POST /', () => {
    test('calls createEvent controller', async () => {
      mockCreateEvent.mockImplementation((req: Request, res: Response) => {
        res.status(201).json(sampleEvent);
      });

      const response = await request(app)
        .post('/')
        .send({
          title: 'Dog Park Playdate',
          description: 'A fun gathering',
          date: new Date('2026-01-10'),
          startTime: new Date('2026-01-10T10:00:00Z'),
          endTime: new Date('2026-01-10T12:00:00Z'),
          parkId: 1,
          organizerId: 123,
          private: 'PUBLIC',
        });

      expect(mockCreateEvent).toHaveBeenCalled();
      expect(response.status).toBe(201);
      expect(response.body.id).toBe(1);
      expect(response.body.title).toBe('Dog Park Playdate');
    });

    test('returns 400 on validation error', async () => {
      mockCreateEvent.mockImplementation((req: Request, res: Response, next: any) => {
        res.status(400).json({ error: 'Validation failed', code: 'VALIDATION_ERROR' });
      });

      const response = await request(app).post('/').send({});

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /events', () => {
    test('calls getAllEvents controller', async () => {
      mockGetAllEvents.mockImplementation((req: Request, res: Response) => {
        res.status(200).json([sampleEvent]);
      });

      const response = await request(app).get('/');

      expect(mockGetAllEvents).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0].id).toBe(1);
    });

    test('returns empty array when no events', async () => {
      mockGetAllEvents.mockImplementation((req: Request, res: Response) => {
        res.status(200).json([]);
      });

      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /:eventId', () => {
    test('calls getEventById controller with eventId param', async () => {
      mockGetEventById.mockImplementation((req: Request, res: Response) => {
        res.status(200).json(sampleEvent);
      });

      const response = await request(app).get('/1');

      expect(mockGetEventById).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
    });

    test('returns 404 when event not found', async () => {
      mockGetEventById.mockImplementation((req: Request, res: Response) => {
        res.status(404).json({ error: 'Event not found', code: 'NOT_FOUND' });
      });

      const response = await request(app).get('/999');

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT //:eventId', () => {
    test('calls updateEvent controller with eventId param', async () => {
      mockUpdateEvent.mockImplementation((req: Request, res: Response) => {
        res.status(200).json({ ...sampleEvent, title: 'Updated Title' });
      });

      const response = await request(app)
        .put('/1')
        .send({ title: 'Updated Title' });

      expect(mockUpdateEvent).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Title');
    });

    test('returns 403 when not authorized', async () => {
      mockUpdateEvent.mockImplementation((req: Request, res: Response) => {
        res.status(403).json({ error: 'Not authorized', code: 'FORBIDDEN' });
      });

      const response = await request(app).put('/1').send({ title: 'Updated' });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('FORBIDDEN');
    });
  });

  describe('DELETE //:eventId', () => {
    test('calls deleteEvent controller with eventId param', async () => {
      mockDeleteEvent.mockImplementation((req: Request, res: Response) => {
        res.status(204).send();
      });

      const response = await request(app).delete('/1');

      expect(mockDeleteEvent).toHaveBeenCalled();
      expect(response.status).toBe(204);
    });

    test('returns 403 when not authorized', async () => {
      mockDeleteEvent.mockImplementation((req: Request, res: Response) => {
        res.status(403).json({ error: 'Not authorized', code: 'FORBIDDEN' });
      });

      const response = await request(app).delete('/1');

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /organizer/:organizerId', () => {
    test('calls getEventsByOrganizer controller with organizerId param', async () => {
      mockGetEventsByOrganizer.mockImplementation((req: Request, res: Response) => {
        res.status(200).json([sampleEvent]);
      });

      const response = await request(app).get('/organizer/123');

      expect(mockGetEventsByOrganizer).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0].id).toBe(1);
    });

    test('returns empty array when no events for organizer', async () => {
      mockGetEventsByOrganizer.mockImplementation((req: Request, res: Response) => {
        res.status(200).json([]);
      });

      const response = await request(app).get('/organizer/999');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('returns validation error for invalid organizerId', async () => {
      mockGetEventsByOrganizer.mockImplementation((req: Request, res: Response) => {
        res.status(400).json({ error: 'Validation failed', code: 'VALIDATION_ERROR' });
      });

      const response = await request(app).get('/organizer/abc');

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /organization/:organizationId', () => {
    test('calls getEventsByOrganization controller with organizationId param', async () => {
      mockGetEventsByOrganization.mockImplementation((req: Request, res: Response) => {
        res.status(200).json([sampleEvent]);
      });

      const response = await request(app).get('/organization/5');

      expect(mockGetEventsByOrganization).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('returns empty array when no events for organization', async () => {
      mockGetEventsByOrganization.mockImplementation((req: Request, res: Response) => {
        res.status(200).json([]);
      });

      const response = await request(app).get('/organization/999');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('returns validation error for invalid organizationId', async () => {
      mockGetEventsByOrganization.mockImplementation((req: Request, res: Response) => {
        res.status(400).json({ error: 'Validation failed', code: 'VALIDATION_ERROR' });
      });

      const response = await request(app).get('/organization/abc');

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /park/:parkId', () => {
    test('calls getEventsByPark controller with parkId param', async () => {
      mockGetEventsByPark.mockImplementation((req: Request, res: Response) => {
        res.status(200).json([sampleEvent]);
      });

      const response = await request(app).get('/park/1');

      expect(mockGetEventsByPark).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('returns empty array when no events for park', async () => {
      mockGetEventsByPark.mockImplementation((req: Request, res: Response) => {
        res.status(200).json([]);
      });

      const response = await request(app).get('/park/999');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('returns validation error for invalid parkId', async () => {
      mockGetEventsByPark.mockImplementation((req: Request, res: Response) => {
        res.status(400).json({ error: 'Validation failed', code: 'VALIDATION_ERROR' });
      });

      const response = await request(app).get('/park/abc');

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /upcoming', () => {
    test('calls getUpcomingEvents controller', async () => {
      mockGetUpcomingEvents.mockImplementation((req: Request, res: Response) => {
        res.status(200).json([sampleEvent]);
      });

      const response = await request(app).get('/upcoming');

      expect(mockGetUpcomingEvents).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('returns empty array when no upcoming events', async () => {
      mockGetUpcomingEvents.mockImplementation((req: Request, res: Response) => {
        res.status(200).json([]);
      });

      const response = await request(app).get('/upcoming');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /:eventId/is-event', () => {
    test('calls isEvent controller with eventId param', async () => {
      mockIsEvent.mockImplementation((req: Request, res: Response) => {
        res.status(200).json({ exists: true });
      });

      const response = await request(app).get('/1/is-event');

      expect(mockIsEvent).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body.exists).toBe(true);
    });

    test('returns exists false when event not found', async () => {
      mockIsEvent.mockImplementation((req: Request, res: Response) => {
        res.status(200).json({ exists: false });
      });

      const response = await request(app).get('/999/is-event');

      expect(response.status).toBe(200);
      expect(response.body.exists).toBe(false);
    });

    test('returns validation error for invalid eventId', async () => {
      mockIsEvent.mockImplementation((req: Request, res: Response) => {
        res.status(400).json({ error: 'Validation failed', code: 'VALIDATION_ERROR' });
      });

      const response = await request(app).get('/abc/is-event');

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Attendance routes', () => {
    test('POST /:eventId/attend calls attendEvent', async () => {
      mockAttendEvent.mockImplementation((req: Request, res: Response) => {
        res.status(200).json({ message: 'ok' });
      });

      const response = await request(app).post('/1/attend');

      expect(mockAttendEvent).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    test('DELETE /:eventId/attend calls cancelAttendance', async () => {
      mockCancelAttendance.mockImplementation((req: Request, res: Response) => {
        res.status(200).json({ message: 'left' });
      });

      const response = await request(app).delete('/1/attend');

      expect(mockCancelAttendance).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    test('GET /:eventId/attendees calls getEventAttendees', async () => {
      mockGetEventAttendees.mockImplementation((req: Request, res: Response) => {
        res.status(200).json([{ id: 1 }]);
      });

      const response = await request(app).get('/1/attendees');

      expect(mockGetEventAttendees).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body[0].id).toBe(1);
    });

    test('DELETE /:eventId/attendees calls removeAllAttendees', async () => {
      mockRemoveAllAttendees.mockImplementation((req: Request, res: Response) => {
        res.status(200).json({ message: 'cleared' });
      });

      const response = await request(app).delete('/1/attendees');

      expect(mockRemoveAllAttendees).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    test('DELETE /:eventId/attendees/user calls removeAttendee', async () => {
      mockRemoveAttendee.mockImplementation((req: Request, res: Response) => {
        res.status(200).json({ message: 'removed' });
      });

      const response = await request(app).delete('/1/attendees/user').send({ userId: 999 });

      expect(mockRemoveAttendee).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });

  describe('Route order and priority', () => {
    test('GET /events/upcoming takes priority over GET /events/:eventId', async () => {
      mockGetUpcomingEvents.mockImplementation((req: Request, res: Response) => {
        res.status(200).json({ route: 'upcoming' });
      });
      mockGetEventById.mockImplementation((req: Request, res: Response) => {
        res.status(200).json({ route: 'getEventById' });
      });

      const response = await request(app).get('/upcoming');

      expect(mockGetUpcomingEvents).toHaveBeenCalled();
      expect(mockGetEventById).not.toHaveBeenCalled();
      expect(response.body.route).toBe('upcoming');
    });

    test('GET /events/park/:parkId takes priority over GET /events/:eventId', async () => {
      mockGetEventsByPark.mockImplementation((req: Request, res: Response) => {
        res.status(200).json({ route: 'park' });
      });
      mockGetEventById.mockImplementation((req: Request, res: Response) => {
        res.status(200).json({ route: 'getEventById' });
      });

      const response = await request(app).get('/park/1');

      expect(mockGetEventsByPark).toHaveBeenCalled();
      expect(mockGetEventById).not.toHaveBeenCalled();
      expect(response.body.route).toBe('park');
    });

    test('GET /events/:eventId/is-event takes priority over GET /events/:eventId', async () => {
      mockIsEvent.mockImplementation((req: Request, res: Response) => {
        res.status(200).json({ route: 'isEvent' });
      });
      mockGetEventById.mockImplementation((req: Request, res: Response) => {
        res.status(200).json({ route: 'getEventById' });
      });

      const response = await request(app).get('/1/is-event');

      expect(mockIsEvent).toHaveBeenCalled();
      expect(mockGetEventById).not.toHaveBeenCalled();
      expect(response.body.route).toBe('isEvent');
    });
  });

  describe('HTTP method validation', () => {
    test('POST /events/:eventId is not allowed (PUT required)', async () => {
      const response = await request(app).post('/1').send({ title: 'Updated' });

      expect(response.status).toBe(404);
    });

    test('GET /events (create) is not allowed (POST required)', async () => {
      const response = await request(app).get('/').send({
        title: 'New Event',
      });

      expect(mockCreateEvent).not.toHaveBeenCalled();
    });

    test('PATCH /events/:eventId is not allowed (PUT required)', async () => {
      const response = await request(app).patch('/1').send({ title: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  describe('Error handling', () => {
    test('handles server errors from controllers', async () => {
      mockGetAllEvents.mockImplementation((req: Request, res: Response) => {
        res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
      });

      const response = await request(app).get('/');

      expect(response.status).toBe(500);
      expect(response.body.code).toBe('INTERNAL_ERROR');
    });

    test('handles missing JSON body gracefully', async () => {
      mockCreateEvent.mockImplementation((req: Request, res: Response) => {
        res.status(400).json({ error: 'Invalid JSON', code: 'PARSE_ERROR' });
      });

      const response = await request(app)
        .post('/')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
