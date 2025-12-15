import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response, Express } from 'express';
import express from 'express';
import request from 'supertest';
import type { User } from '@prisma/client';

// Create mock functions as any to allow typed implementations
const mockCreateUser = jest.fn() as any;
const mockGetUserByEmail = jest.fn() as any;

// Mock the controller
jest.mock('../controllers/userController', () => ({
  __esModule: true,
  default: {
    createUser: mockCreateUser,
    getUserByEmail: mockGetUserByEmail,
  },
}));

// Import router after mocks are set up
import userRouter from '../routes/userRouter';

describe('User Router', () => {
  let app: Express;

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use(userRouter);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /users', () => {
    test('calls createUser controller method with request and response', async () => {
      mockCreateUser.mockImplementation((req: Request, res: Response) => {
        res.status(201).json({ id: 1, username: 'newuser' });
      });

      const response = await request(app)
        .post('/users')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123',
        });

      expect(mockCreateUser).toHaveBeenCalled();
      expect(response.status).toBe(201);
    });

    test('returns 400 when required fields are missing', async () => {
      mockCreateUser.mockImplementation((req: Request, res: Response) => {
        res.status(400).json({ error: 'Missing required fields' });
      });

      const response = await request(app).post('/users').send({
        email: 'test@example.com',
        // Missing username and password
      });

      expect(mockCreateUser).toHaveBeenCalled();
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
    });

    test('returns 409 when email already exists', async () => {
      mockCreateUser.mockImplementation((req: Request, res: Response) => {
        res.status(409).json({ error: 'Email already in use' });
      });

      const response = await request(app)
        .post('/users')
        .send({
          username: 'testuser',
          email: 'existing@example.com',
          password: 'password123',
        });

      expect(mockCreateUser).toHaveBeenCalled();
      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Email already in use');
    });

    test('returns 201 with user data on successful creation', async () => {
      const mockUser: Omit<User, 'dogs' | 'favoriteParks' | 'eventsOwned' | 'eventsAttending'> = {
        id: 1,
        username: 'newuser',
        email: 'new@example.com',
        password_hash: 'hashed',
        first_name: null,
        last_name: null,
        profilePictureUrl: null,
        role: 'CLIENT',
        ExpPoints: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCreateUser.mockImplementation((req: Request, res: Response) => {
        res.status(201).json(mockUser);
      });

      const response = await request(app)
        .post('/users')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123',
        });

      expect(mockCreateUser).toHaveBeenCalled();
      expect(response.status).toBe(201);
      expect(response.body.id).toBe(1);
      expect(response.body.username).toBe('newuser');
    });

    test('returns 500 on server error', async () => {
      mockCreateUser.mockImplementation((req: Request, res: Response) => {
        res.status(500).json({ error: 'Failed to create user' });
      });

      const response = await request(app)
        .post('/users')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      expect(mockCreateUser).toHaveBeenCalled();
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create user');
    });
  });

  describe('GET /users/:email', () => {
    test('calls getUserByEmail controller method with request and response', async () => {
      mockGetUserByEmail.mockImplementation((req: Request, res: Response) => {
        res.status(200).json({ id: 1, email: 'test@example.com' });
      });

      const response = await request(app).get('/users/test@example.com');

      expect(mockGetUserByEmail).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    test('returns 404 when user is not found', async () => {
      mockGetUserByEmail.mockImplementation((req: Request, res: Response) => {
        res.status(404).json({ error: 'User not found' });
      });

      const response = await request(app).get('/users/notfound@example.com');

      expect(mockGetUserByEmail).toHaveBeenCalled();
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    test('returns 200 with user data when user is found', async () => {
      const mockUser: Omit<User, 'dogs' | 'favoriteParks' | 'eventsOwned' | 'eventsAttending'> = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed',
        first_name: 'Test',
        last_name: 'User',
        profilePictureUrl: null,
        role: 'CLIENT',
        ExpPoints: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGetUserByEmail.mockImplementation((req: Request, res: Response) => {
        res.status(200).json(mockUser);
      });

      const response = await request(app).get('/users/test@example.com');

      expect(mockGetUserByEmail).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body.email).toBe('test@example.com');
      expect(response.body.username).toBe('testuser');
    });

    test('returns 500 on server error', async () => {
      mockGetUserByEmail.mockImplementation((req: Request, res: Response) => {
        res.status(500).json({ error: 'Failed to retrieve user' });
      });

      const response = await request(app).get('/users/test@example.com');

      expect(mockGetUserByEmail).toHaveBeenCalled();
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to retrieve user');
    });

    test('passes email from route params to controller', async () => {
      mockGetUserByEmail.mockImplementation((req: Request, res: Response) => {
        // Verify the email param was passed
        expect(req.params.email).toBe('test@example.com');
        res.status(200).json({ email: req.params.email });
      });

      await request(app).get('/users/test@example.com');

      expect(mockGetUserByEmail).toHaveBeenCalled();
    });
  });

  describe('Route setup', () => {
    test('POST /users route is registered', async () => {
      mockCreateUser.mockImplementation((req: Request, res: Response) => {
        res.status(201).json({ success: true });
      });

      const response = await request(app)
        .post('/users')
        .send({ username: 'test', email: 'test@example.com', password: 'password123' });

      expect(response.status).not.toBe(404);
    });

    test('GET /users/:email route is registered', async () => {
      mockGetUserByEmail.mockImplementation((req: Request, res: Response) => {
        res.status(200).json({ success: true });
      });

      const response = await request(app).get('/users/test@example.com');

      expect(response.status).not.toBe(404);
    });

    test('undefined routes return 404', async () => {
      const response = await request(app).get('/undefined-route');

      expect(response.status).toBe(404);
    });
  });
});