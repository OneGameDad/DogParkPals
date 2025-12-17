import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction} from 'express';
import express from 'express';
import request from 'supertest';

const addFriendMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();
const acceptFriendRequestMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();
const declineFriendRequestMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();
const removeFriendMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();
const getFriendsListMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();
const getFriendMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();

jest.mock('../controllers/friendController', () => ({
	__esModule: true,
	default: {
		addFriend: addFriendMock,
		acceptFriendRequest: acceptFriendRequestMock,
		declineFriendRequest: declineFriendRequestMock,
		removeFriend: removeFriendMock,
		getFriendsList: getFriendsListMock,
		getFriend: getFriendMock,
	},
}));

import friendRouter from '../routes/friendRouter';

const okHandler = (name: string) => (req: Request, res: Response) => res.status(200).json({ handler: name, params: req.params, body: req.body });

const defaultHandlers = () => {
	addFriendMock.mockImplementation(okHandler('addFriend'));
	acceptFriendRequestMock.mockImplementation(okHandler('acceptFriendRequest'));
	declineFriendRequestMock.mockImplementation(okHandler('declineFriendRequest'));
	removeFriendMock.mockImplementation(okHandler('removeFriend'));
	getFriendsListMock.mockImplementation(okHandler('getFriendsList'));
	getFriendMock.mockImplementation(okHandler('getFriend'));
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

	test('POST /friends routes to addFriend', async () => {
		const payload = { requesterId: 1, addresseeId: 2 };
		const response = await request(buildApp()).post('/friends').send(payload);

		expect(response.status).toBe(200);
		expect(response.body.handler).toBe('addFriend');
		expect(addFriendMock).toHaveBeenCalledTimes(1);
		expect(addFriendMock.mock.calls[0][0].body).toEqual(payload);
	});

	test('POST /friends/accept routes to acceptFriendRequest', async () => {
		const payload = { requesterId: 1, addresseeId: 2 };
		const response = await request(buildApp()).post('/friends/accept').send(payload);

		expect(response.status).toBe(200);
		expect(response.body.handler).toBe('acceptFriendRequest');
		expect(acceptFriendRequestMock).toHaveBeenCalledTimes(1);
		expect(acceptFriendRequestMock.mock.calls[0][0].body).toEqual(payload);
	});

	test('POST /friends/decline routes to declineFriendRequest', async () => {
		const payload = { requesterId: 1, addresseeId: 2 };
		const response = await request(buildApp()).post('/friends/decline').send(payload);

		expect(response.status).toBe(200);
		expect(response.body.handler).toBe('declineFriendRequest');
		expect(declineFriendRequestMock).toHaveBeenCalledTimes(1);
		expect(declineFriendRequestMock.mock.calls[0][0].body).toEqual(payload);
	});

	test('DELETE /friends routes to removeFriend', async () => {
		const payload = { userId: 1, friendId: 2 };
		const response = await request(buildApp()).delete('/friends').send(payload);

		expect(response.status).toBe(200);
		expect(response.body.handler).toBe('removeFriend');
		expect(removeFriendMock).toHaveBeenCalledTimes(1);
		expect(removeFriendMock.mock.calls[0][0].body).toEqual(payload);
	});

	test('GET /friends routes to getFriendsList', async () => {
		const response = await request(buildApp()).get('/friends');

		expect(response.status).toBe(200);
		expect(response.body.handler).toBe('getFriendsList');
		expect(getFriendsListMock).toHaveBeenCalledTimes(1);
	});

	test('GET /friends/:friendId routes to getFriend with params', async () => {
		const response = await request(buildApp()).get('/friends/42');

		expect(response.status).toBe(200);
		expect(response.body.handler).toBe('getFriend');
		expect(response.body.params.friendId).toBe('42');
		expect(getFriendMock).toHaveBeenCalledTimes(1);
		expect(getFriendMock.mock.calls[0][0].params.friendId).toBe('42');
	});
});
