import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction} from 'express';
import express from 'express';
import request from 'supertest';

// Mock the auth middleware before importing the router
jest.mock('../middlewares/authMiddleware', () => ({
	requireAuth: (req: Request, res: Response, next: NextFunction) => {
		(req as any).userId = 1;
		next();
	},
}));

const addFriendMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();
const acceptFriendRequestMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();
const declineFriendRequestMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();
const removeFriendMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();
const getFriendsListMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();

jest.mock('../controllers/friendController', () => ({
	__esModule: true,
	default: {
		addFriend: addFriendMock,
		acceptFriendRequest: acceptFriendRequestMock,
		declineFriendRequest: declineFriendRequestMock,
		removeFriend: removeFriendMock,
		getFriendsList: getFriendsListMock,
	},
}));

import friendRouter from '../routes/friendRouter';

const okHandler = (name: string) => (req: Request, res: Response) => res.status(200).json({ handler: name, params: req.params, body: req.body, query: req.query });

const defaultHandlers = () => {
	addFriendMock.mockImplementation(okHandler('addFriend'));
	acceptFriendRequestMock.mockImplementation(okHandler('acceptFriendRequest'));
	declineFriendRequestMock.mockImplementation(okHandler('declineFriendRequest'));
	removeFriendMock.mockImplementation(okHandler('removeFriend'));
	getFriendsListMock.mockImplementation(okHandler('getFriendsList'));
};

const buildApp = () => {
	const app = express();
	app.use(express.json());
	app.use(friendRouter);
	return app;
};

describe('friendRouter', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		defaultHandlers();
	});

	test('POST / routes to addFriend', async () => {
		const payload = { requesterId: 1, addresseeId: 2 };
		const response = await request(buildApp()).post('/').send(payload);

		expect(response.status).toBe(200);
		expect(response.body.handler).toBe('addFriend');
		expect(addFriendMock).toHaveBeenCalledTimes(1);
		expect(addFriendMock.mock.calls[0][0].body).toEqual(payload);
	});

	test('POST /accept routes to acceptFriendRequest', async () => {
		const payload = { requesterId: 1, addresseeId: 2 };
		const response = await request(buildApp()).post('/accept').send(payload);

		expect(response.status).toBe(200);
		expect(response.body.handler).toBe('acceptFriendRequest');
		expect(acceptFriendRequestMock).toHaveBeenCalledTimes(1);
		expect(acceptFriendRequestMock.mock.calls[0][0].body).toEqual(payload);
	});

	test('POST /decline routes to declineFriendRequest', async () => {
		const payload = { requesterId: 1, addresseeId: 2 };
		const response = await request(buildApp()).post('/decline').send(payload);

		expect(response.status).toBe(200);
		expect(response.body.handler).toBe('declineFriendRequest');
		expect(declineFriendRequestMock).toHaveBeenCalledTimes(1);
		expect(declineFriendRequestMock.mock.calls[0][0].body).toEqual(payload);
	});

	test('DELETE / routes to removeFriend', async () => {
		const payload = { userId: 1, friendId: 2 };
		const response = await request(buildApp()).delete('/').send(payload);

		expect(response.status).toBe(200);
		expect(response.body.handler).toBe('removeFriend');
		expect(removeFriendMock).toHaveBeenCalledTimes(1);
		expect(removeFriendMock.mock.calls[0][0].body).toEqual(payload);
	});

	test('GET / routes to getFriendsList', async () => {
		const response = await request(buildApp()).get('/?userId=1');

		expect(response.status).toBe(200);
		expect(response.body.handler).toBe('getFriendsList');
		expect(response.body.query.userId).toBe('1');
		expect(getFriendsListMock).toHaveBeenCalledTimes(1);
		expect(getFriendsListMock.mock.calls[0][0].query.userId).toBe('1');
	});

	test('GET / with dogId routes to getFriendsList', async () => {
		const response = await request(buildApp()).get('/?dogId=2');

		expect(response.status).toBe(200);
		expect(response.body.handler).toBe('getFriendsList');
		expect(response.body.query.dogId).toBe('2');
		expect(getFriendsListMock).toHaveBeenCalledTimes(1);
		expect(getFriendsListMock.mock.calls[0][0].query.dogId).toBe('2');
	});
});
