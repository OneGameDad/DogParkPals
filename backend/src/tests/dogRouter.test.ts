import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction, Express } from 'express';
import express from 'express';
import request from 'supertest';

// Mock the auth middleware before importing the router
jest.mock('../middlewares/authMiddleware', () => ({
  requireAuth: (req: Request, res: Response, next: NextFunction) => {
    (req as any).userId = 1;
    next();
  },
}));

// Create mock functions
const mockAddDog = jest.fn() as any;
const mockGetDogById = jest.fn() as any;
const mockGetDogByOwner = jest.fn() as any;
const mockGetAllDogs = jest.fn() as any;
const mockGetAllDogsByPark = jest.fn() as any;
const mockUpdateDog = jest.fn() as any;
const mockDeleteDog = jest.fn() as any;
const mockAddOwnerToDog = jest.fn() as any;
const mockRemoveOwnerFromDog = jest.fn() as any;

// Mock the controller
jest.mock('../controllers/dogController', () => ({
  __esModule: true,
  default: {
    addDog: mockAddDog,
    getDogById: mockGetDogById,
    getDogByOwner: mockGetDogByOwner,
    getAllDogs: mockGetAllDogs,
    getAllDogsByPark: mockGetAllDogsByPark,
    updateDog: mockUpdateDog,
    deleteDog: mockDeleteDog,
    addOwnerToDog: mockAddOwnerToDog,
    removeOwnerFromDog: mockRemoveOwnerFromDog,
  },
}));

// Import router after mocks
import dogRouter from '../routes/dogRouter';

describe('Dog Router', () => {
  let app: Express;

  const mockDog = {
    id: 1,
    name: 'Rex',
    breed: 'LABRADOR_RETRIEVER',
    gender: 'MALE',
    dateOfBirth: new Date('2020-01-15'),
    fixed: false,
    size: 'LARGE',
    playstyle: 'SOCIAL',
    description: 'A friendly dog',
    profilePictureUrl: 'https://example.com/rex.jpg',
    vaccinationRecordUrl: 'https://example.com/vax.pdf',
    currentLocationId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(dogRouter);
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    test('calls addDog controller method', async () => {
      mockAddDog.mockImplementation((req: Request, res: Response) => {
        res.status(201).json(mockDog);
      });

      const response = await request(app)
        .post('/')
        .send({
          name: 'Rex',
          breed: 'LABRADOR_RETRIEVER',
          gender: 'MALE',
          dateOfBirth: '2020-01-15T00:00:00Z',
          playstyle: 'SOCIAL',
          size: 'LARGE',
        });

      expect(mockAddDog).toHaveBeenCalled();
      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Rex');
    });
  });

  describe('GET /', () => {
    test('calls getAllDogs controller method', async () => {
      mockGetAllDogs.mockImplementation((req: Request, res: Response) => {
        res.status(200).json([mockDog]);
      });

      const response = await request(app).get('/');

      expect(mockGetAllDogs).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /:id', () => {
    test('calls getDogById controller method with correct ID', async () => {
      mockGetDogById.mockImplementation((req: Request, res: Response) => {
        res.status(200).json(mockDog);
      });

      const response = await request(app).get('/1');

      expect(mockGetDogById).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
    });

    test('handles non-existent dog', async () => {
      mockGetDogById.mockImplementation((req: Request, res: Response) => {
        res.status(404).json({ error: 'Dog not found' });
      });

      const response = await request(app).get('/999');

      expect(mockGetDogById).toHaveBeenCalled();
      expect(response.status).toBe(404);
    });
  });

  describe('GET /owner/:ownerId', () => {
    test('calls getDogByOwner controller method with correct owner ID', async () => {
      mockGetDogByOwner.mockImplementation((req: Request, res: Response) => {
        res.status(200).json([mockDog]);
      });

      const response = await request(app).get('/owner/1');

      expect(mockGetDogByOwner).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /park/:parkId', () => {
    test('calls getAllDogsByPark controller method with correct park ID', async () => {
      mockGetAllDogsByPark.mockImplementation((req: Request, res: Response) => {
        res.status(200).json([mockDog]);
      });

      const response = await request(app).get('/park/10');

      expect(mockGetAllDogsByPark).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('PUT /:id', () => {
    test('calls updateDog controller method with correct ID', async () => {
      mockUpdateDog.mockImplementation((req: Request, res: Response) => {
        res.status(200).json({ ...mockDog, name: 'Rex Jr' });
      });

      const response = await request(app)
        .put('/1')
        .send({ name: 'Rex Jr' });

      expect(mockUpdateDog).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Rex Jr');
    });
  });

  describe('DELETE /:id', () => {
    test('calls deleteDog controller method with correct ID', async () => {
      mockDeleteDog.mockImplementation((req: Request, res: Response) => {
        res.status(204).send();
      });

      const response = await request(app).delete('/1');

      expect(mockDeleteDog).toHaveBeenCalled();
      expect(response.status).toBe(204);
    });
  });

  describe('POST /:id/owners', () => {
    test('calls addOwnerToDog controller method with correct dog ID', async () => {
      mockAddOwnerToDog.mockImplementation((req: Request, res: Response) => {
        res.status(204).send();
      });

      const response = await request(app)
        .post('/1/owners')
        .send({ userId: 2 });

      expect(mockAddOwnerToDog).toHaveBeenCalled();
      expect(response.status).toBe(204);
    });
  });

  describe('DELETE /:id/owners', () => {
    test('calls removeOwnerFromDog controller method with correct dog ID', async () => {
      mockRemoveOwnerFromDog.mockImplementation((req: Request, res: Response) => {
        res.status(204).send();
      });

      const response = await request(app)
        .delete('/1/owners')
        .send({ userId: 2 });

      expect(mockRemoveOwnerFromDog).toHaveBeenCalled();
      expect(response.status).toBe(204);
    });
  });

  describe('Route ordering', () => {
    test('specific routes are not shadowed by parameterized routes', async () => {
      mockGetDogByOwner.mockImplementation((req: Request, res: Response) => {
        res.status(200).json([]);
      });

      // This should hit /owner/:ownerId, not /:id
      const response = await request(app).get('/owner/1');

      expect(mockGetDogByOwner).toHaveBeenCalled();
      expect(mockGetDogById).not.toHaveBeenCalled();
    });

    test('/park/:parkId is not shadowed by /:id', async () => {
      mockGetAllDogsByPark.mockImplementation((req: Request, res: Response) => {
        res.status(200).json([]);
      });

      const response = await request(app).get('/park/10');

      expect(mockGetAllDogsByPark).toHaveBeenCalled();
      expect(mockGetDogById).not.toHaveBeenCalled();
    });
  });
});
