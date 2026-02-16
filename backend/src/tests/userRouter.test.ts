import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response, Express, NextFunction } from 'express';
import express from 'express';
import request from 'supertest';
import type { User } from '@prisma/client';

// Create mock functions as any to allow typed implementations
const mockCreateUser = jest.fn() as any;
const mockGetUserByEmail = jest.fn() as any;
const mockGetUserById = jest.fn() as any;
const mockGetUserByUsername = jest.fn() as any;
const mockGetAllUsers = jest.fn() as any;
const mockDeleteUser = jest.fn() as any;
const mockChangePassword = jest.fn() as any;
const mockChangeUsername = jest.fn() as any;
const mockChangeUserRole = jest.fn() as any;
const mockUploadProfilePicture = jest.fn() as any;
const mockDeleteProfilePicture = jest.fn() as any;
const mockRecordHeartbeat = jest.fn() as any;
const mockGetUserPresence = jest.fn() as any;

// Mock the controller
jest.mock('../controllers/userController', () => ({
  __esModule: true,
  default: {
    createUser: mockCreateUser,
    getUserByEmail: mockGetUserByEmail,
    getUserById: mockGetUserById,
    getUserByUsername: mockGetUserByUsername,
    getAllUsers: mockGetAllUsers,
    deleteUser: mockDeleteUser,
    changePassword: mockChangePassword,
    changeUsername: mockChangeUsername,
    changeUserRole: mockChangeUserRole,
    uploadProfilePicture: mockUploadProfilePicture,
    deleteProfilePicture: mockDeleteProfilePicture,
    recordHeartbeat: mockRecordHeartbeat,
    getUserPresence: mockGetUserPresence,
  },
}));

// Mock auth middleware to noop during router tests
jest.mock('../middlewares/authMiddleware', () => ({
  __esModule: true,
  requireAuth: (req: Request, res: Response, next: NextFunction) => {
    (req as any).userId = 1;
    (req as any).user = { id: 1, role: 'ADMIN' };
    next();
  },
}));

jest.mock('../middlewares/authorizationMiddleware', () => ({
  __esModule: true,
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

jest.mock('../middlewares/uploadMiddleware', () => ({
  uploadSingleFile: (req: Request, res: Response, next: NextFunction) => {
    // simulate a file being attached
    (req as any).file = { originalname: 'mock.png', buffer: Buffer.from('mock') };
    next();
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

  describe('POST /', () => {
    test('calls createUser controller method with request and response', async () => {
      mockCreateUser.mockImplementation((req: Request, res: Response) => {
        res.status(201).json({ id: 1, username: 'newuser' });
      });

      const response = await request(app)
        .post('/')
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
        res.status(400).json({ error: 'Missing required fields', code: 'VALIDATION_ERROR' });
      });

      const response = await request(app)
        .post('/')
        .send({
          email: 'test@example.com',
          // Missing username and password
        });

      expect(mockCreateUser).toHaveBeenCalled();
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    test('returns 409 when email already exists', async () => {
      mockCreateUser.mockImplementation((req: Request, res: Response) => {
        res.status(409).json({ error: 'Email already in use', code: 'CONFLICT' });
      });

      const response = await request(app)
        .post('/')
        .send({
          username: 'testuser',
          email: 'existing@example.com',
          password: 'password123',
        });

      expect(mockCreateUser).toHaveBeenCalled();
      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Email already in use');
      expect(response.body.code).toBe('CONFLICT');
    });

    test('returns 201 with user data on successful creation', async () => {
      const mockUser = {
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
      } as unknown as User;

      mockCreateUser.mockImplementation((req: Request, res: Response) => {
        res.status(201).json(mockUser);
      });

      const response = await request(app)
        .post('/')
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
        res.status(500).json({ error: 'Failed to create user', code: 'INTERNAL_ERROR' });
      });

      const response = await request(app)
        .post('/')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      expect(mockCreateUser).toHaveBeenCalled();
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create user');
      expect(response.body.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('GET /email/:email', () => {
    test('calls getUserByEmail controller method with request and response', async () => {
      mockGetUserByEmail.mockImplementation((req: Request, res: Response) => {
        res.status(200).json({ id: 1, email: 'test@example.com' });
      });

      const response = await request(app).get('/email/test@example.com');

      expect(mockGetUserByEmail).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    test('returns 404 when user is not found', async () => {
      mockGetUserByEmail.mockImplementation((req: Request, res: Response) => {
        res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
      });

      const response = await request(app).get('/email/notfound@example.com');

      expect(mockGetUserByEmail).toHaveBeenCalled();
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
      expect(response.body.code).toBe('NOT_FOUND');
    });

    test('returns 200 with user data when user is found', async () => {
      const mockUser = {
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
      } as unknown as User;

      mockGetUserByEmail.mockImplementation((req: Request, res: Response) => {
        res.status(200).json(mockUser);
      });

      const response = await request(app).get('/email/test@example.com');

      expect(mockGetUserByEmail).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body.email).toBe('test@example.com');
      expect(response.body.username).toBe('testuser');
    });

    test('returns 500 on server error', async () => {
      mockGetUserByEmail.mockImplementation((req: Request, res: Response) => {
        res.status(500).json({ error: 'Failed to retrieve user', code: 'INTERNAL_ERROR' });
      });

      const response = await request(app).get('/email/test@example.com');

      expect(mockGetUserByEmail).toHaveBeenCalled();
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to retrieve user');
      expect(response.body.code).toBe('INTERNAL_ERROR');
    });

    test('passes email from route params to controller', async () => {
      mockGetUserByEmail.mockImplementation((req: Request, res: Response) => {
        // Verify the email param was passed
        expect(req.params.email).toBe('test@example.com');
        res.status(200).json({ email: req.params.email });
      });

      await request(app).get('/email/test@example.com');

      expect(mockGetUserByEmail).toHaveBeenCalled();
    });
  });

  describe('GET /id/:id', () => {
    test('calls getUserById controller', async () => {
      mockGetUserById.mockImplementation((req: Request, res: Response) => {
        res.status(200).json({ id: req.params.id });
      });

      const response = await request(app).get('/id/5');

      expect(mockGetUserById).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body.id).toBe('5');
    });
  });

  describe('GET /username/:username', () => {
    test('calls getUserByUsername controller', async () => {
      mockGetUserByUsername.mockImplementation((req: Request, res: Response) => {
        res.status(200).json({ username: req.params.username });
      });

      const response = await request(app).get('/username/testuser');

      expect(mockGetUserByUsername).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body.username).toBe('testuser');
    });
  });

  describe('GET /', () => {
    test('calls getAllUsers controller', async () => {
      mockGetAllUsers.mockImplementation((_req: Request, res: Response) => {
        res.status(200).json([]);
      });

      const response = await request(app).get('/');

      expect(mockGetAllUsers).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });

  describe('POST /presence/heartbeat', () => {
    test('calls recordHeartbeat controller', async () => {
      mockRecordHeartbeat.mockImplementation((_req: Request, res: Response) => {
        res.status(200).json({ userId: 1, isOnline: true });
      });

      const response = await request(app).post('/presence/heartbeat');

      expect(mockRecordHeartbeat).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body.userId).toBe(1);
      expect(response.body.isOnline).toBe(true);
    });
  });

  describe('GET /presence', () => {
    test('calls getUserPresence controller for current user', async () => {
      mockGetUserPresence.mockImplementation((req: Request, res: Response) => {
        res.status(200).json({ userId: (req as any).userId, isOnline: true });
      });

      const response = await request(app).get('/presence');

      expect(mockGetUserPresence).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body.userId).toBe(1);
    });
  });

  describe('GET /presence/:id', () => {
    test('calls getUserPresence controller for specified user', async () => {
      mockGetUserPresence.mockImplementation((req: Request, res: Response) => {
        res.status(200).json({ userId: Number(req.params.id), isOnline: false });
      });

      const response = await request(app).get('/presence/42');

      expect(mockGetUserPresence).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body.userId).toBe(42);
    });
  });

  describe('DELETE /:id', () => {
    test('calls deleteUser controller', async () => {
      mockDeleteUser.mockImplementation((req: Request, res: Response) => {
        res.status(204).send();
      });

      const response = await request(app).delete('/9');

      expect(mockDeleteUser).toHaveBeenCalled();
      expect(response.status).toBe(204);
    });
  });

  describe('POST /change-password', () => {
    test('calls changePassword controller', async () => {
      mockChangePassword.mockImplementation((_req: Request, res: Response) => {
        res.status(200).json({ message: 'ok' });
      });

      const response = await request(app)
        .post('/change-password')
        .send({ oldPassword: 'oldpass123', newPassword: 'newpass123' });

      expect(mockChangePassword).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });

  describe('POST /change-username', () => {
    test('calls changeUsername controller', async () => {
      mockChangeUsername.mockImplementation((_req: Request, res: Response) => {
        res.status(200).json({ id: 1, username: 'newname' });
      });

      const response = await request(app)
        .post('/change-username')
        .send({ newUsername: 'newname' });

      expect(mockChangeUsername).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });

  describe('PATCH /role', () => {
    test('calls changeUserRole controller', async () => {
      mockChangeUserRole.mockImplementation((_req: Request, res: Response) => {
        res.status(200).json({ id: 2, role: 'ADMIN' });
      });

      const response = await request(app)
        .patch('/role')
        .send({ userId: 2, role: 'ADMIN' });

      expect(mockChangeUserRole).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });

  describe('Route setup', () => {
    test('POST /users route is registered', async () => {
      mockCreateUser.mockImplementation((req: Request, res: Response) => {
        res.status(201).json({ success: true });
      });

      const response = await request(app)
        .post('/')
        .send({ username: 'test', email: 'test@example.com', password: 'password123' });

      expect(response.status).not.toBe(404);
    });

    test('GET /users/:email route is registered', async () => {
      mockGetUserByEmail.mockImplementation((req: Request, res: Response) => {
        res.status(200).json({ success: true });
      });

      const response = await request(app).get('/email/test@example.com');

      expect(response.status).not.toBe(404);
    });

    test('undefined routes return 404', async () => {
      const response = await request(app).get('/undefined-route');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /profile-picture', () => {
    test('calls uploadProfilePicture controller and returns 201', async () => {
      mockUploadProfilePicture.mockImplementation((_req: Request, res: Response) => {
        res.status(201).json({ url: '/api/files/users/1/profile-picture' });
      });

      const response = await request(app)
        .post('/profile-picture')
        .attach('file', Buffer.from('test'), 'profile.png');

      expect(mockUploadProfilePicture).toHaveBeenCalled();
      expect(response.status).toBe(201);
      expect(response.body.url).toBe('/api/files/users/1/profile-picture');
    });

    test('returns 500 on server error', async () => {
      mockUploadProfilePicture.mockImplementation((_req: Request, res: Response) => {
        res.status(500).json({ error: 'Upload failed', code: 'INTERNAL_ERROR' });
      });

      const response = await request(app)
        .post('/profile-picture')
        .attach('file', Buffer.from('test'), 'profile.png');

      expect(mockUploadProfilePicture).toHaveBeenCalled();
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Upload failed');
      expect(response.body.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('DELETE /profile-picture', () => {
    test('calls deleteProfilePicture controller and returns 200', async () => {
      mockDeleteProfilePicture.mockImplementation((_req, res) => {
        res.status(200).json({ message: 'Profile picture deleted' });
      });

      const response = await request(app).delete('/profile-picture');

      expect(mockDeleteProfilePicture).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Profile picture deleted');
    });

    test('returns 500 on server error', async () => {
      mockDeleteProfilePicture.mockImplementation((_req, res) => {
        res.status(500).json({ error: 'Delete failed', code: 'INTERNAL_ERROR' });
      });

      const response = await request(app).delete('/profile-picture');

      expect(mockDeleteProfilePicture).toHaveBeenCalled();
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Delete failed');
      expect(response.body.code).toBe('INTERNAL_ERROR');
    });
  });
});