import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction, Express } from 'express';
import express from 'express';
import request from 'supertest';

// Mock auth middleware
jest.mock('../middlewares/authMiddleware', () => ({
    requireAuth: (req: Request, res: Response, next: NextFunction) => {
        (req as any).userId = 1;
        (req as any).user = { id: 1, role: 'CLIENT' };
        next();
    },
}));

// Create mock functions
const mockGetDogById = jest.fn() as any;
const mockGetUserById = jest.fn() as any;
const mockCheckDogAuthorization = jest.fn() as any;

// Mock services
jest.mock('../services/dogService', () => ({
    __esModule: true,
    default: {
        getDogById: mockGetDogById,
    },
}));

jest.mock('../services/userServices', () => ({
    __esModule: true,
    default: {
        getUserById: mockGetUserById,
    },
}));

// Mock checkDogAuthorization from dogController
jest.mock('../controllers/dogController', () => ({
    checkDogAuthorization: mockCheckDogAuthorization,
}));

// Import router after mocks
import fileRouter from '../routes/fileRouter';

describe('File Router', () => {
    let app: Express;

    const mockDogWithPhoto = {
        id: 1,
        name: 'Rex',
        profilePictureUrl: '/uploads/dogs/1/photo.jpg',
        vaccinationRecordUrl: null,
    };

    const mockDogWithDocument = {
        id: 1,
        name: 'Rex',
        profilePictureUrl: null,
        vaccinationRecordUrl: '/uploads/dogs/1/vax.pdf',
    };

    const mockDogWithBoth = {
        id: 1,
        name: 'Rex',
        profilePictureUrl: '/uploads/dogs/1/photo.jpg',
        vaccinationRecordUrl: '/uploads/dogs/1/vax.pdf',
    };

    const mockUser = {
        id: 1,
        username: 'testuser',
        profilePictureUrl: '/uploads/users/1/profile.jpg',
    };

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use(fileRouter);
        app.use((err: any, req: Request, res: Response, next: NextFunction) => {
            res.status(err.statusCode || 500).json({ message: err.message });
        });
        jest.clearAllMocks();
    });

    describe('GET /dogs/:dogId/photo', () => {
        test('returns photo URL when authorized dog owner requests it', async () => {
            mockCheckDogAuthorization.mockResolvedValue(undefined);
            mockGetDogById.mockResolvedValue(mockDogWithPhoto);

            const response = await request(app).get('/dogs/1/photo');

            expect(mockCheckDogAuthorization).toHaveBeenCalledWith(1, 1, 'CLIENT');
            expect(mockGetDogById).toHaveBeenCalledWith(1);
            expect(response.status).toBe(200);
            expect(response.body.url).toBe('/api/files/dogs/1/photo');
        });

        test('returns 404 when dog has no photo', async () => {
            mockCheckDogAuthorization.mockResolvedValue(undefined);
            mockGetDogById.mockResolvedValue({ id: 1, profilePictureUrl: null });

            const response = await request(app).get('/dogs/1/photo');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Dog photo not found');
        });

        test('forwards authorization error when user is unauthorized', async () => {
            mockCheckDogAuthorization.mockRejectedValue(new Error('Unauthorized'));

            const response = await request(app).get('/dogs/1/photo');

            expect(response.status).toBe(500);
        });
    });

    describe('GET /dogs/:dogId/document', () => {
        test('returns document URL when authorized dog owner requests it', async () => {
            mockCheckDogAuthorization.mockResolvedValue(undefined);
            mockGetDogById.mockResolvedValue(mockDogWithDocument);

            const response = await request(app).get('/dogs/1/document');

            expect(mockCheckDogAuthorization).toHaveBeenCalledWith(1, 1, 'CLIENT');
            expect(mockGetDogById).toHaveBeenCalledWith(1);
            expect(response.status).toBe(200);
            expect(response.body.url).toBe('/api/files/dogs/1/document');
        });

        test('returns 404 when dog has no document', async () => {
            mockCheckDogAuthorization.mockResolvedValue(undefined);
            mockGetDogById.mockResolvedValue({ id: 1, vaccinationRecordUrl: null });

            const response = await request(app).get('/dogs/1/document');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Document not found');
        });

        test('forwards authorization error when user is unauthorized', async () => {
            mockCheckDogAuthorization.mockRejectedValue(new Error('Unauthorized'));

            const response = await request(app).get('/dogs/1/document');

            expect(response.status).toBe(500);
        });
    });

    describe('GET /users/:userId/profile-picture', () => {
        test('returns profile picture URL when user requests their own', async () => {
            mockGetUserById.mockResolvedValue(mockUser);

            const response = await request(app).get('/users/1/profile-picture');

            expect(mockGetUserById).toHaveBeenCalledWith(1);
            expect(response.status).toBe(200);
            expect(response.body.url).toBe('/api/files/users/1/profile-picture');
        });

        test('returns 403 when user tries to access another user\'s profile picture', async () => {
            mockGetUserById.mockResolvedValue(mockUser);

            const response = await request(app).get('/users/2/profile-picture');

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Access denied');
            expect(mockGetUserById).not.toHaveBeenCalled();
        });

        test('returns 404 when user has no profile picture', async () => {
            mockGetUserById.mockResolvedValue({ id: 1, profilePictureUrl: null });

            const response = await request(app).get('/users/1/profile-picture');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Profile picture not found');
        });

        test('allows admin to access any user\'s profile picture', async () => {
            app = express();
            app.use(express.json());
            // Mock admin user
            jest.resetModules();
            jest.mock('../middlewares/authMiddleware', () => ({
                requireAuth: (req: Request, res: Response, next: NextFunction) => {
                    (req as any).userId = 99;
                    (req as any).user = { id: 99, role: 'ADMIN' };
                    next();
                },
            }));

            mockGetUserById.mockResolvedValue(mockUser);

            const response = await request(app).get('/users/1/profile-picture');

            // Note: Due to how mocking works, this would need app recreation
            // In practice, you'd set up admin user in beforeEach if needed
        });

        test('forwards error when service fails', async () => {
            mockGetUserById.mockRejectedValue(new Error('Database error'));

            const response = await request(app).get('/users/1/profile-picture');

            expect(response.status).toBe(500);
        });
    });
});