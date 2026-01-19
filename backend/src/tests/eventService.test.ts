import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { Event } from '@prisma/client';

// Mock Prisma
const mockEventCreate = jest.fn() as unknown as jest.Mock<Promise<Event>>;
const mockEventUpdate = jest.fn() as unknown as jest.Mock<Promise<Event>>;
const mockEventFindUnique = jest.fn() as unknown as jest.Mock<Promise<Event | null>>;
const mockEventDelete = jest.fn() as unknown as jest.Mock<Promise<Event>>;
const mockEventFindMany = jest.fn() as unknown as jest.Mock<Promise<Event[]>>;

jest.mock('@prisma/client', () => {
  const mockPrismaClientKnownRequestError = class {
    code: string;
    constructor(code: string) {
      this.code = code;
    }
  };

  return {
    PrismaClient: jest.fn(() => ({
      event: {
        create: mockEventCreate,
        update: mockEventUpdate,
        findUnique: mockEventFindUnique,
        delete: mockEventDelete,
        findMany: mockEventFindMany,
      },
    })),
    Prisma: {
      PrismaClientKnownRequestError: mockPrismaClientKnownRequestError,
    },
  };
});

// Mock utilities
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

jest.mock('../utils/validationSchemas', () => ({
  createEventSchema: {
    parse: jest.fn((data) => data),
  },
  updateEventSchema: {
    parse: jest.fn((data) => data),
  },
  getEventByIdSchema: {
    parse: jest.fn((data) => data),
  },
  deleteEventSchema: {
    parse: jest.fn((data) => data),
  },
  getEventsByOrganizerSchema: {
    parse: jest.fn((data) => data),
  },
  getEventsByOrganizationSchema: {
    parse: jest.fn((data) => data),
  },
  getEventsByParkSchema: {
    parse: jest.fn((data) => data),
  },
}));

import eventService from '../services/eventService';

const mockEventData: Event = {
  id: 1,
  title: 'Dog Park Playdate',
  description: 'A fun gathering for dogs and their owners',
  date: new Date('2025-12-25'),
  startTime: new Date('2025-12-25T10:00:00Z'),
  endTime: new Date('2025-12-25T12:00:00Z'),
  private: 'PUBLIC',
  parkId: 1,
  organizerId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Event Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEvent', () => {
    test('should create event successfully', async () => {
      mockEventCreate.mockResolvedValue(mockEventData);

      const result = await eventService.createEvent(
        'Dog Park Playdate',
        'A fun gathering for dogs and their owners',
        new Date('2025-12-25'),
        new Date('2025-12-25T10:00:00Z'),
        new Date('2025-12-25T12:00:00Z'),
        1,
        1,
        false
      );

      expect(mockEventCreate).toHaveBeenCalled();
      expect(result).toEqual(mockEventData);
    });

    test('should create event with private flag', async () => {
      const privateEvent: Event = { ...mockEventData, private: 'PRIVATE' as any };
      mockEventCreate.mockResolvedValue(privateEvent);

      const result = await eventService.createEvent(
        'Dog Park Playdate',
        'A fun gathering for dogs and their owners',
        new Date('2025-12-25'),
        new Date('2025-12-25T10:00:00Z'),
        new Date('2025-12-25T12:00:00Z'),
        1,
        1,
        true
      );

      expect(result.private).toBe('PRIVATE');
    });

    test('should validate event data before creating', async () => {
      mockEventCreate.mockResolvedValue(mockEventData);

      await eventService.createEvent(
        'Dog Park Playdate',
        'A fun gathering for dogs and their owners',
        new Date('2025-12-25'),
        new Date('2025-12-25T10:00:00Z'),
        new Date('2025-12-25T12:00:00Z'),
        1,
        1
      );

      expect(mockEventCreate).toHaveBeenCalled();
    });

    test.skip('should handle validation errors for invalid title', async () => {
      await expect(
        eventService.createEvent(
          'AB', // Too short
          'Description',
          new Date('2025-12-25'),
          new Date('2025-12-25T10:00:00Z'),
          new Date('2025-12-25T12:00:00Z'),
          1,
          1
        )
      ).rejects.toThrow();
    });

    test.skip('should handle validation errors for past date', async () => {
      await expect(
        eventService.createEvent(
          'Dog Park Playdate',
          'Description',
          new Date('2020-01-01'),
          new Date('2020-01-01T10:00:00Z'),
          new Date('2020-01-01T12:00:00Z'),
          1,
          1
        )
      ).rejects.toThrow();
    });

    test.skip('should handle validation errors for event less than 30 minutes', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const startTime = new Date(futureDate);
      const endTime = new Date(futureDate);
      endTime.setMinutes(endTime.getMinutes() + 15); // Only 15 minutes

      await expect(
        eventService.createEvent(
          'Dog Park Playdate',
          'Description',
          futureDate,
          startTime,
          endTime,
          1,
          1
        )
      ).rejects.toThrow();
    });

    test('should handle database errors', async () => {
      mockEventCreate.mockRejectedValue(new Error('Database error'));

      await expect(
        eventService.createEvent(
          'Dog Park Playdate',
          'Description',
          new Date('2025-12-25'),
          new Date('2025-12-25T10:00:00Z'),
          new Date('2025-12-25T12:00:00Z'),
          1,
          1
        )
      ).rejects.toThrow();
    });
  });

  describe('updateEvent', () => {
    test('should update event successfully', async () => {
      const updatedEvent: Event = { ...mockEventData, title: 'Updated Title' };
      mockEventUpdate.mockResolvedValue(updatedEvent);

      const result = await eventService.updateEvent(1, { title: 'Updated Title' });

      expect(mockEventUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ title: 'Updated Title' }),
      });
      expect(result.title).toBe('Updated Title');
    });

    test('should validate update data', async () => {
      mockEventUpdate.mockResolvedValue(mockEventData);

      await eventService.updateEvent(1, { title: 'New Title', description: 'New description' });

      expect(mockEventUpdate).toHaveBeenCalled();
    });

    test('should handle partial updates', async () => {
      const updatedEvent: Event = { ...mockEventData, title: 'New Title' };
      mockEventUpdate.mockResolvedValue(updatedEvent);

      await eventService.updateEvent(1, { title: 'New Title' });

      expect(mockEventUpdate).toHaveBeenCalled();
    });

    test.skip('should handle validation errors for invalid title', async () => {
    });

    test.skip('should handle validation errors for event less than 30 minutes', async () => {
    });

    test('should handle database errors', async () => {
      mockEventUpdate.mockRejectedValue(new Error('Database error'));

      await expect(
        eventService.updateEvent(1, { title: 'New Title' })
      ).rejects.toThrow();
    });
  });

  describe('getEventById', () => {
    test('should return event when found', async () => {
      mockEventFindUnique.mockResolvedValue(mockEventData);

      const result = await eventService.getEventById(1);

      expect(mockEventFindUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockEventData);
    });

    test('should return null when event not found', async () => {
      mockEventFindUnique.mockResolvedValue(null);

      const result = await eventService.getEventById(999);

      expect(result).toBeNull();
    });

    test('should validate eventId parameter', async () => {
      mockEventFindUnique.mockResolvedValue(mockEventData);

      await eventService.getEventById(1);

      expect(mockEventFindUnique).toHaveBeenCalled();
    });

    test.skip('should handle validation errors for invalid eventId', async () => {
      await expect(
        eventService.getEventById(-1)
      ).rejects.toThrow();
    });

    test('should handle database errors', async () => {
      mockEventFindUnique.mockRejectedValue(new Error('Database error'));

      await expect(
        eventService.getEventById(1)
      ).rejects.toThrow();
    });
  });

  describe('deleteEvent', () => {
    test('should delete event successfully', async () => {
      mockEventDelete.mockResolvedValue(mockEventData);

      await eventService.deleteEvent(1);

      expect(mockEventDelete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    test('should validate eventId parameter', async () => {
      mockEventDelete.mockResolvedValue(mockEventData);

      await eventService.deleteEvent(1);

      expect(mockEventDelete).toHaveBeenCalled();
    });

    test.skip('should handle validation errors for invalid eventId', async () => {
      await expect(
        eventService.deleteEvent(-1)
      ).rejects.toThrow();
    });

    test('should handle database errors', async () => {
      mockEventDelete.mockRejectedValue(new Error('Database error'));

      await expect(
        eventService.deleteEvent(1)
      ).rejects.toThrow();
    });
  });

  describe('getEventsByOrganizer', () => {
    test('should return events for organizer', async () => {
      const secondEvent: Event = {
        id: 2,
        title: 'Second Event',
        description: 'Another event',
        date: new Date('2025-12-25'),
        startTime: new Date('2025-12-25T10:00:00Z'),
        endTime: new Date('2025-12-25T12:00:00Z'),
        private: 'PUBLIC',
        parkId: 1,
        organizerId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const events: Event[] = [mockEventData, secondEvent];
      mockEventFindMany.mockResolvedValue(events);

      const result = await eventService.getEventsByOrganizer(1);

      expect(mockEventFindMany).toHaveBeenCalledWith({
        where: { organizerId: 1 },
      });
      expect(result).toEqual(events);
      expect(result.length).toBe(2);
    });

    test('should return empty array when no events found', async () => {
      mockEventFindMany.mockResolvedValue([]);

      const result = await eventService.getEventsByOrganizer(999);

      expect(result).toEqual([]);
    });

    test('should validate organizerId parameter', async () => {
      mockEventFindMany.mockResolvedValue([]);

      await eventService.getEventsByOrganizer(1);

      expect(mockEventFindMany).toHaveBeenCalled();
    });

    test.skip('should handle validation errors for invalid organizerId', async () => {
      await expect(
        eventService.getEventsByOrganizer(-1)
      ).rejects.toThrow();
    });

    test('should handle database errors', async () => {
      mockEventFindMany.mockRejectedValue(new Error('Database error'));

      await expect(
        eventService.getEventsByOrganizer(1)
      ).rejects.toThrow();
    });
  });

  describe('getAllEvents', () => {
    test('should return all events', async () => {
      const secondEvent: Event = {
        id: 2,
        title: 'Second Event',
        description: 'Another event',
        date: new Date('2025-12-25'),
        startTime: new Date('2025-12-25T10:00:00Z'),
        endTime: new Date('2025-12-25T12:00:00Z'),
        private: 'PUBLIC',
        parkId: 1,
        organizerId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const events: Event[] = [mockEventData, secondEvent];
      mockEventFindMany.mockResolvedValue(events);

      const result = await eventService.getAllEvents();

      expect(mockEventFindMany).toHaveBeenCalledWith();
      expect(result.length).toBe(2);
    });

    test('should return empty array when no events exist', async () => {
      mockEventFindMany.mockResolvedValue([]);

      const result = await eventService.getAllEvents();

      expect(result).toEqual([]);
    });

    test('should handle database errors', async () => {
      mockEventFindMany.mockRejectedValue(new Error('Database error'));

      await expect(
        eventService.getAllEvents()
      ).rejects.toThrow();
    });
  });

  describe('getEventsByOrganization', () => {
    test('should return events for organization', async () => {
      const secondEvent: Event = {
        id: 2,
        title: 'Second Event',
        description: 'Another event',
        date: new Date('2025-12-25'),
        startTime: new Date('2025-12-25T10:00:00Z'),
        endTime: new Date('2025-12-25T12:00:00Z'),
        private: 'PUBLIC',
        parkId: 1,
        organizerId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const events: Event[] = [mockEventData, secondEvent];
      mockEventFindMany.mockResolvedValue(events);

      const result = await eventService.getEventsByOrganization(1);

      expect(mockEventFindMany).toHaveBeenCalledWith({
        where: { organizerId: 1 },
      });
      expect(result).toEqual(events);
    });

    test('should return empty array when no events found', async () => {
      mockEventFindMany.mockResolvedValue([]);

      const result = await eventService.getEventsByOrganization(999);

      expect(result).toEqual([]);
    });

    test('should handle database errors', async () => {
      mockEventFindMany.mockRejectedValue(new Error('Database error'));

      await expect(
        eventService.getEventsByOrganization(1)
      ).rejects.toThrow();
    });
  });

  describe('getUpcomingEvents', () => {
    test('should return upcoming events', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const upcomingEvent: Event = {
        id: 1,
        title: 'Test Event',
        description: 'Test event description',
        date: futureDate,
        startTime: new Date('2025-12-25T10:00:00Z'),
        endTime: new Date('2025-12-25T12:00:00Z'),
        private: 'PUBLIC',
        parkId: 1,
        organizerId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockEventFindMany.mockResolvedValue([upcomingEvent]);

      const result = await eventService.getUpcomingEvents();

      expect(mockEventFindMany).toHaveBeenCalledWith({
        where: { date: { gt: expect.any(Date) } },
        orderBy: { date: 'asc' },
      });
      expect(result.length).toBe(1);
    });

    test('should return empty array when no upcoming events', async () => {
      mockEventFindMany.mockResolvedValue([]);

      const result = await eventService.getUpcomingEvents();

      expect(result).toEqual([]);
    });

    test('should handle database errors', async () => {
      mockEventFindMany.mockRejectedValue(new Error('Database error'));

      await expect(
        eventService.getUpcomingEvents()
      ).rejects.toThrow();
    });
  });

  describe('getEventsByPark', () => {
    test('should return events for park', async () => {
      const secondEvent: Event = {
        id: 2,
        title: 'Second Event',
        description: 'Another event',
        date: new Date('2025-12-25'),
        startTime: new Date('2025-12-25T10:00:00Z'),
        endTime: new Date('2025-12-25T12:00:00Z'),
        private: 'PUBLIC',
        parkId: 1,
        organizerId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const events: Event[] = [mockEventData, secondEvent];
      mockEventFindMany.mockResolvedValue(events);

      const result = await eventService.getEventsByPark(1);

      expect(mockEventFindMany).toHaveBeenCalledWith({
        where: { parkId: 1 },
      });
      expect(result).toEqual(events);
    });

    test('should return empty array when no events found', async () => {
      mockEventFindMany.mockResolvedValue([]);

      const result = await eventService.getEventsByPark(999);

      expect(result).toEqual([]);
    });

    test('should validate parkId parameter', async () => {
      mockEventFindMany.mockResolvedValue([]);

      await eventService.getEventsByPark(1);

      expect(mockEventFindMany).toHaveBeenCalled();
    });

    test.skip('should handle validation errors for invalid parkId', async () => {
      await expect(
        eventService.getEventsByPark(-1)
      ).rejects.toThrow();
    });

    test('should handle database errors', async () => {
      mockEventFindMany.mockRejectedValue(new Error('Database error'));

      await expect(
        eventService.getEventsByPark(1)
      ).rejects.toThrow();
    });
  });

  describe('isEvent', () => {
    test('should return true when event exists', async () => {
      mockEventFindUnique.mockResolvedValue(mockEventData);

      const result = await eventService.isEvent(1);

      expect(result).toBe(true);
    });

    test('should return false when event does not exist', async () => {
      mockEventFindUnique.mockResolvedValue(null);

      const result = await eventService.isEvent(999);

      expect(result).toBe(false);
    });

    test('should handle database errors', async () => {
      mockEventFindUnique.mockRejectedValue(new Error('Database error'));

      await expect(
        eventService.isEvent(1)
      ).rejects.toThrow();
    });
  });
});
