import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import express from 'express';

// Mock the auth middleware before importing the router
jest.mock('../middlewares/authMiddleware', () => ({
  requireAuth: (req: Request, res: Response, next: NextFunction) => {
    (req as any).userId = 1;
    next();
  },
}));

import parkRouter from '../routes/parkRouter';

// Mock parkController
const mockGetParkById = jest.fn();
const mockGetParkByName = jest.fn();
const mockGetParksNearLocation = jest.fn();
const mockGetAllParks = jest.fn();
const mockGetParksByAmenity = jest.fn();
const mockCreatePark = jest.fn();
const mockUpdatePark = jest.fn();
const mockDeletePark = jest.fn();
const mockAddParkToUserFavorites = jest.fn();
const mockRemoveParkFromUserFavorites = jest.fn();
const mockGetUserFavoriteParks = jest.fn();
const mockCheckInAtPark = jest.fn();
const mockCheckOutFromPark = jest.fn();
const mockGetActiveCheckInsForPark = jest.fn();

jest.mock('../controllers/parkController', () => ({
  __esModule: true,
  default: {
    getParkById: (req: any, res: any, next: any) => mockGetParkById(req, res, next),
    getParkByName: (req: any, res: any, next: any) => mockGetParkByName(req, res, next),
    getParksNearLocation: (req: any, res: any, next: any) => mockGetParksNearLocation(req, res, next),
    getAllParks: (req: any, res: any, next: any) => mockGetAllParks(req, res, next),
    getParksByAmenity: (req: any, res: any, next: any) => mockGetParksByAmenity(req, res, next),
    createPark: (req: any, res: any, next: any) => mockCreatePark(req, res, next),
    updatePark: (req: any, res: any, next: any) => mockUpdatePark(req, res, next),
    deletePark: (req: any, res: any, next: any) => mockDeletePark(req, res, next),
    addParkToUserFavorites: (req: any, res: any, next: any) => mockAddParkToUserFavorites(req, res, next),
    removeParkFromUserFavorites: (req: any, res: any, next: any) => mockRemoveParkFromUserFavorites(req, res, next),
    getUserFavoriteParks: (req: any, res: any, next: any) => mockGetUserFavoriteParks(req, res, next),
    checkInAtPark: (req: any, res: any, next: any) => mockCheckInAtPark(req, res, next),
    checkOutFromPark: (req: any, res: any, next: any) => mockCheckOutFromPark(req, res, next),
    getActiveCheckInsForPark: (req: any, res: any, next: any) => mockGetActiveCheckInsForPark(req, res, next),
  },
}));

// Create Express app with router
const app = express();
app.use(express.json());
app.use(parkRouter);

describe('Park Router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /:id', () => {
    test('should call getParkById with id parameter', async () => {
      mockGetParkById.mockImplementation((req, res) => {
        res.status(200).json({ id: 1, name: 'Park' });
      });

      await request(app)
        .get('/1')
        .expect(200);

      expect(mockGetParkById).toHaveBeenCalled();
    });

    test('should route to getParkById controller', async () => {
      mockGetParkById.mockImplementation((req, res) => {
        expect(req.params.id).toBe('1');
        res.status(200).json({ id: 1 });
      });

      await request(app).get('/1');

      expect(mockGetParkById).toHaveBeenCalled();
    });
  });

  describe('GET /name/:name', () => {
    test('should call getParkByName with name parameter', async () => {
      mockGetParkByName.mockImplementation((req, res) => {
        res.status(200).json({ id: 1, name: req.params.name });
      });

      await request(app)
        .get('/name/Central%20Park')
        .expect(200);

      expect(mockGetParkByName).toHaveBeenCalled();
    });

    test('should pass name parameter correctly', async () => {
      mockGetParkByName.mockImplementation((req, res) => {
        expect(req.params.name).toBe('Central Park');
        res.status(200).json({ name: req.params.name });
      });

      await request(app).get('/name/Central%20Park');

      expect(mockGetParkByName).toHaveBeenCalled();
    });
  });

  describe('GET /nearby', () => {
    test('should call getParksNearLocation with query params', async () => {
      mockGetParksNearLocation.mockImplementation((req, res) => {
        res.status(200).json([]);
      });

      await request(app)
        .get('/nearby')
        .query({ latitude: '40.7829', longitude: '-73.9654', radiusInKm: '5' })
        .expect(200);

      expect(mockGetParksNearLocation).toHaveBeenCalled();
    });

    test('should pass query parameters to controller', async () => {
      mockGetParksNearLocation.mockImplementation((req, res) => {
        expect(req.query.latitude).toBe('40.7829');
        expect(req.query.longitude).toBe('-73.9654');
        expect(req.query.radiusInKm).toBe('5');
        res.status(200).json([]);
      });

      await request(app)
        .get('/nearby')
        .query({ latitude: '40.7829', longitude: '-73.9654', radiusInKm: '5' });

      expect(mockGetParksNearLocation).toHaveBeenCalled();
    });
  });

  describe('GET /amenities', () => {
    test('should call getParksByAmenity with amenity query param', async () => {
      mockGetParksByAmenity.mockImplementation((req, res) => {
        res.status(200).json([]);
      });

      await request(app)
        .get('/amenities')
        .query({ amenity: 'water' })
        .expect(200);

      expect(mockGetParksByAmenity).toHaveBeenCalled();
    });

    test('should pass amenity query parameter to controller', async () => {
      mockGetParksByAmenity.mockImplementation((req, res) => {
        expect(req.query.amenity).toBe('water');
        res.status(200).json([]);
      });

      await request(app)
        .get('/amenities')
        .query({ amenity: 'water' });

      expect(mockGetParksByAmenity).toHaveBeenCalled();
    });
  });

  describe('GET /', () => {
    test('should call getAllParks', async () => {
      mockGetAllParks.mockImplementation((req, res) => {
        res.status(200).json([]);
      });

      await request(app)
        .get('/')
        .expect(200);

      expect(mockGetAllParks).toHaveBeenCalled();
    });

    test('should not require query parameters', async () => {
      mockGetAllParks.mockImplementation((req, res) => {
        res.status(200).json([{ id: 1 }, { id: 2 }]);
      });

      const response = await request(app)
        .get('/')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /', () => {
    test('should call createPark with request body', async () => {
      mockCreatePark.mockImplementation((req, res) => {
        res.status(201).json({ id: 1, name: req.body.name });
      });

      const parkData = {
        name: 'New Park',
        latitude: 40.7580,
        longitude: -73.9855,
      };

      await request(app)
        .post('/')
        .send(parkData)
        .expect(201);

      expect(mockCreatePark).toHaveBeenCalled();
    });

    test('should pass request body to controller', async () => {
      mockCreatePark.mockImplementation((req, res) => {
        expect(req.body.name).toBe('New Park');
        expect(req.body.latitude).toBe(40.7580);
        expect(req.body.longitude).toBe(-73.9855);
        res.status(201).json(req.body);
      });

      const parkData = {
        name: 'New Park',
        latitude: 40.7580,
        longitude: -73.9855,
      };

      await request(app)
        .post('/')
        .send(parkData);

      expect(mockCreatePark).toHaveBeenCalled();
    });
  });

  describe('PUT /:id', () => {
    test('should call updatePark with id and request body', async () => {
      mockUpdatePark.mockImplementation((req, res) => {
        res.status(200).json({ id: req.params.id, name: req.body.name });
      });

      const updates = { name: 'Updated Park' };

      await request(app)
        .put('/1')
        .send(updates)
        .expect(200);

      expect(mockUpdatePark).toHaveBeenCalled();
    });

    test('should pass id and updates to controller', async () => {
      mockUpdatePark.mockImplementation((req, res) => {
        expect(req.params.id).toBe('1');
        expect(req.body.name).toBe('Updated Park');
        res.status(200).json(req.body);
      });

      await request(app)
        .put('/1')
        .send({ name: 'Updated Park' });

      expect(mockUpdatePark).toHaveBeenCalled();
    });
  });

  describe('DELETE /:id', () => {
    test('should call deletePark with id parameter', async () => {
      mockDeletePark.mockImplementation((req, res) => {
        res.status(204).send();
      });

      await request(app)
        .delete('/1')
        .expect(204);

      expect(mockDeletePark).toHaveBeenCalled();
    });

    test('should pass id parameter to controller', async () => {
      mockDeletePark.mockImplementation((req, res) => {
        expect(req.params.id).toBe('1');
        res.status(204).send();
      });

      await request(app).delete('/1');

      expect(mockDeletePark).toHaveBeenCalled();
    });
  });

  describe('POST /favorites/:userId/:parkId', () => {
    test('should call addParkToUserFavorites with userId and parkId', async () => {
      mockAddParkToUserFavorites.mockImplementation((req, res) => {
        res.status(200).json({ message: 'Park added to favorites' });
      });

      await request(app)
        .post('/favorites/1/1')
        .expect(200);

      expect(mockAddParkToUserFavorites).toHaveBeenCalled();
    });

    test('should pass userId and parkId to controller', async () => {
      mockAddParkToUserFavorites.mockImplementation((req, res) => {
        expect(req.params.userId).toBe('1');
        expect(req.params.parkId).toBe('2');
        res.status(200).json({ message: 'Added' });
      });

      await request(app).post('/favorites/1/2');

      expect(mockAddParkToUserFavorites).toHaveBeenCalled();
    });
  });

  describe('GET /favorites/:userId', () => {
    test('should call getUserFavoriteParks with userId', async () => {
      mockGetUserFavoriteParks.mockImplementation((req, res) => {
        res.status(200).json([]);
      });

      await request(app)
        .get('/favorites/1')
        .expect(200);

      expect(mockGetUserFavoriteParks).toHaveBeenCalled();
    });

    test('should pass userId to controller', async () => {
      mockGetUserFavoriteParks.mockImplementation((req, res) => {
        expect(req.params.userId).toBe('2');
        res.status(200).json([]);
      });

      await request(app).get('/favorites/2');

      expect(mockGetUserFavoriteParks).toHaveBeenCalled();
    });
  });

  describe('DELETE /favorites/:userId/:parkId', () => {
    test('should call removeParkFromUserFavorites with userId and parkId', async () => {
      mockRemoveParkFromUserFavorites.mockImplementation((req, res) => {
        res.status(200).json({ message: 'Park removed from favorites' });
      });

      await request(app)
        .delete('/favorites/1/1')
        .expect(200);

      expect(mockRemoveParkFromUserFavorites).toHaveBeenCalled();
    });

    test('should pass userId and parkId to controller', async () => {
      mockRemoveParkFromUserFavorites.mockImplementation((req, res) => {
        expect(req.params.userId).toBe('1');
        expect(req.params.parkId).toBe('2');
        res.status(200).json({ message: 'Removed' });
      });

      await request(app).delete('/favorites/1/2');

      expect(mockRemoveParkFromUserFavorites).toHaveBeenCalled();
    });
  });

  describe('Route ordering', () => {
    test('should match specific route /name/:name before generic /:id', async () => {
      mockGetParkByName.mockImplementation((req, res) => {
        res.status(200).json({ type: 'by-name' });
      });

      const response = await request(app).get('/name/test');

      expect(response.body.type).toBe('by-name');
      expect(mockGetParkByName).toHaveBeenCalled();
      expect(mockGetParkById).not.toHaveBeenCalled();
    });

    test('should match specific route /amenities before generic /:id', async () => {
      mockGetParksByAmenity.mockImplementation((req, res) => {
        res.status(200).json({ type: 'amenities' });
      });

      const response = await request(app).get('/amenities?amenity=water');

      expect(response.body.type).toBe('amenities');
      expect(mockGetParksByAmenity).toHaveBeenCalled();
      expect(mockGetParkById).not.toHaveBeenCalled();
    });

    test('should match specific route /nearby before generic /:id', async () => {
      mockGetParksNearLocation.mockImplementation((req, res) => {
        res.status(200).json({ type: 'nearby' });
      });

      const response = await request(app).get('/nearby?latitude=40&longitude=-73&radiusInKm=5');

      expect(response.body.type).toBe('nearby');
      expect(mockGetParksNearLocation).toHaveBeenCalled();
      expect(mockGetParkById).not.toHaveBeenCalled();
    });
  });

  describe('HTTP Methods', () => {
    test('should use correct HTTP method for GET all parks', async () => {
      mockGetAllParks.mockImplementation((req, res) => {
        res.status(200).json([]);
      });

      await request(app).get('/').expect(200);
      expect(mockGetAllParks).toHaveBeenCalled();
    });

    test('should use correct HTTP method for POST create park', async () => {
      mockCreatePark.mockImplementation((req, res) => {
        res.status(201).json({ id: 1 });
      });

      await request(app).post('/').send({ name: 'Park' }).expect(201);
      expect(mockCreatePark).toHaveBeenCalled();
    });

    test('should use correct HTTP method for PUT update park', async () => {
      mockUpdatePark.mockImplementation((req, res) => {
        res.status(200).json({ id: 1 });
      });

      await request(app).put('/1').send({ name: 'Updated' }).expect(200);
      expect(mockUpdatePark).toHaveBeenCalled();
    });

    test('should use correct HTTP method for DELETE park', async () => {
      mockDeletePark.mockImplementation((req, res) => {
        res.status(204).send();
      });

      await request(app).delete('/1').expect(204);
      expect(mockDeletePark).toHaveBeenCalled();
    });
  });

  describe('Check-in / Check-out routes', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    // Tests for POST /parks/:parkId/check-in
    test('should call checkInAtPark controller with parkId', async () => {
      // Mock implementation of the controller
      mockCheckInAtPark.mockImplementation((req, res) => {
        // Check that parkId is passed correctly
        expect(req.params.parkId).toBe('123');
        res.status(200).json({ message: 'Checked in successfully' });
      });
  
      // Make request to the route
      const response = await request(app)
        .post('/123/check-in')
        .expect(200);

      // Check response body
      expect(response.body.message).toBe('Checked in successfully');
      // Ensure controller was called
      expect(mockCheckInAtPark).toHaveBeenCalled();
    });
  
    // Tests for POST /:parkId/check-out
    test('should call checkOutFromPark controller with parkId', async () => {
      mockCheckOutFromPark.mockImplementation((req, res) => {
        expect(req.params.parkId).toBe('123');
        res.status(200).json({ message: 'Checked out successfully' });
      });
  
      const response = await request(app)
        .post('/123/check-out')
        .expect(200);
  
      expect(response.body.message).toBe('Checked out successfully');
      expect(mockCheckOutFromPark).toHaveBeenCalled();
    });
  
    // Tests for GET /:parkId/check-ins
    test('should call getActiveCheckInsForPark controller with parkId', async () => {
      mockGetActiveCheckInsForPark.mockImplementation((req, res) => {
        expect(req.params.parkId).toBe('123');
        // Return a fake list of active check-ins
        res.status(200).json([
          { userId: 1, parkId: 123, checkedInAt: new Date() },
          { userId: 2, parkId: 123, checkedInAt: new Date() },
        ]);
      });
  
      const response = await request(app)
        .get('/123/check-ins')
        .expect(200);
  
      // Expect array of check-ins
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(mockGetActiveCheckInsForPark).toHaveBeenCalled();
    });
  });
  
});
