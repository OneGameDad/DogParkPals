import request from 'supertest';
import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
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
        it('returns photo file when authorized', async () => {
            const tempFile = path.join(os.tmpdir(), `dog-photo-${Date.now()}.txt`);
            fs.writeFileSync(tempFile, 'dog-photo');

            (checkDogAuthorization as jest.Mock).mockResolvedValue(undefined);
            (dogService.getDogById as jest.Mock).mockResolvedValue({
                id: 1,
                profilePictureUrl: tempFile,
            });

            const res = await request(app).get('/api/files/dogs/1/photo');

            expect(res.status).toBe(200);
            expect(res.text).toBe('dog-photo');
            expect(checkDogAuthorization).toHaveBeenCalledWith(1, 1, 'CLIENT');

            fs.unlinkSync(tempFile);
        });

        it('returns 404 if no photo', async () => {
            (checkDogAuthorization as jest.Mock).mockResolvedValue(undefined);
            (dogService.getDogById as jest.Mock).mockResolvedValue({ id: 1, profilePictureUrl: null });

            const res = await request(app).get('/api/files/dogs/1/photo');

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ message: 'Dog photo not found' });
        });

        it('returns error when not authorized', async () => {
            (checkDogAuthorization as jest.Mock).mockRejectedValue(new Error('Not authorized'));

            const res = await request(app).get('/api/files/dogs/1/photo');

            expect(res.status).toBe(500);
        });
    });

    describe('GET /dogs/:dogId/document', () => {
        it('returns document file when authorized', async () => {
            const tempFile = path.join(os.tmpdir(), `dog-doc-${Date.now()}.txt`);
            fs.writeFileSync(tempFile, 'dog-document');

            (checkDogAuthorization as jest.Mock).mockResolvedValue(undefined);
            (dogService.getDogById as jest.Mock).mockResolvedValue({
                id: 1,
                vaccinationRecordUrl: tempFile,
            });

            const res = await request(app).get('/api/files/dogs/1/document');

            expect(res.status).toBe(200);
            expect(res.text).toBe('dog-document');
            expect(checkDogAuthorization).toHaveBeenCalledWith(1, 1, 'CLIENT');

            fs.unlinkSync(tempFile);
        });

        it('returns 404 if no document', async () => {
            (checkDogAuthorization as jest.Mock).mockResolvedValue(undefined);
            (dogService.getDogById as jest.Mock).mockResolvedValue({ id: 1, vaccinationRecordUrl: null });

            const res = await request(app).get('/api/files/dogs/1/document');

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ message: 'Document not found' });
        });

        it('returns error when not authorized', async () => {
            (checkDogAuthorization as jest.Mock).mockRejectedValue(new Error('Not authorized'));

            const res = await request(app).get('/api/files/dogs/1/document');

            expect(res.status).toBe(500);
        });
    });

    describe('GET /users/:userId/profile-picture', () => {
        it('returns profile picture for own profile', async () => {
            const tempFile = path.join(os.tmpdir(), `profile-photo-${Date.now()}.txt`);
            fs.writeFileSync(tempFile, 'profile-photo');

            (userService.getUserById as jest.Mock).mockResolvedValue({
                id: 1,
                profilePictureUrl: tempFile,
            });

            const res = await request(app).get('/api/files/users/1/profile-picture');

            expect(res.status).toBe(200);
            expect(res.text).toBe('profile-photo');

            fs.unlinkSync(tempFile);
        });

        it('returns 403 when accessing another user\'s picture', async () => {
            (userService.getUserById as jest.Mock).mockResolvedValue({
                id: 2,
                profilePictureUrl: '/some/path/profile.jpg',
            });

            const res = await request(app).get('/api/files/users/2/profile-picture');

            expect(res.status).toBe(403);
            expect(res.body).toEqual({ message: 'Not authorized to access this profile picture' });
        });

        it('returns 404 when user has no profile picture', async () => {
            (userService.getUserById as jest.Mock).mockResolvedValue({
                id: 1,
                profilePictureUrl: null,
            });

            const res = await request(app).get('/api/files/users/1/profile-picture');

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ message: 'Profile picture not found' });
        });
    });
});