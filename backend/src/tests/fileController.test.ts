import request from 'supertest';
import express from 'express';
import fileController from '../controllers/fileController';
import dogService from '../services/dogService';
import userService from '../services/userServices';
import { checkDogAuthorization } from '../controllers/dogController';

jest.mock('../services/dogService');
jest.mock('../services/userServices');
jest.mock('../controllers/dogController');

describe('fileController router', () => {
    let app: express.Express;

    beforeEach(() => {
        jest.clearAllMocks();

        app = express();
        app.use((req, res, next) => {
            // mock user authentication
            req.userId = 1;
            req.user = { id: 1, role: 'CLIENT' };
            next();
        });
        app.use('/api/files', fileController);
    });

    describe('GET /dogs/:dogId/photo', () => {
        it('returns photo URL when authorized', async () => {
            (checkDogAuthorization as jest.Mock).mockResolvedValue(undefined);
            (dogService.getDogById as jest.Mock).mockResolvedValue({
                id: 1,
                profilePictureUrl: '/uploads/dogs/1/photo.jpg',
            });

            const res = await request(app).get('/api/files/dogs/1/photo');

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ url: '/api/files/dogs/1/photo' });
            expect(checkDogAuthorization).toHaveBeenCalledWith(1, 1, 'CLIENT');
        });

        it('returns 404 if no photo', async () => {
            (checkDogAuthorization as jest.Mock).mockResolvedValue(undefined);
            (dogService.getDogById as jest.Mock).mockResolvedValue({ id: 1, profilePictureUrl: null });

            const res = await request(app).get('/api/files/dogs/1/photo');

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ message: 'Dog photo not found' });
        });
    });

    describe('GET /users/:userId/profile-picture', () => {
        it('returns profile picture for self', async () => {
            (userService.getUserById as jest.Mock).mockResolvedValue({
                id: 1,
                profilePictureUrl: '/uploads/users/1/profile.jpg',
            });

            const res = await request(app).get('/api/files/users/1/profile-picture');

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ url: '/api/files/users/1/profile-picture' });
        });

        it('returns 403 when accessing another user', async () => {
            const res = await request(app).get('/api/files/users/2/profile-picture');
            expect(res.status).toBe(403);
            expect(res.body).toEqual({ message: 'Access denied' });
        });
    });
});