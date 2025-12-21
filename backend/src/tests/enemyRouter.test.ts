import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction} from 'express';
import express from 'express';
import request from 'supertest';

const addEnemyMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();
const confirmAddEnemyMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();
const removeEnemyMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();
const getEnemyMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();
const getEnemiesListMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();
const isEnemyMock = jest.fn<(req: Request, res: Response, next: NextFunction) => unknown>();

jest.mock('../controllers/enemyController', () => ({
	__esModule: true,
	default: {
		addEnemy: addEnemyMock,
		confirmAddEnemy: confirmAddEnemyMock,
		removeEnemy: removeEnemyMock,
		getEnemy: getEnemyMock,
		getEnemiesList: getEnemiesListMock,
		isEnemy: isEnemyMock,
	},
}));

import enemyRouter from '../routes/enemyRouter';

const okHandler = (name: string) => (req: Request, res: Response) => res.status(200).json({ handler: name, params: req.params, body: req.body });

const defaultHandlers = () => {
	addEnemyMock.mockImplementation(okHandler('addEnemy'));
	confirmAddEnemyMock.mockImplementation(okHandler('confirmAddEnemy'));
	removeEnemyMock.mockImplementation(okHandler('removeEnemy'));
	getEnemyMock.mockImplementation(okHandler('getEnemy'));
	getEnemiesListMock.mockImplementation(okHandler('getEnemiesList'));
	isEnemyMock.mockImplementation(okHandler('isEnemy'));
};

const buildApp = () => {
	const app = express();
	app.use(express.json());
	app.use(enemyRouter);
	return app;
};

describe('enemyRouter', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		defaultHandlers();
	});

	describe('POST /enemies', () => {
		test('routes to addEnemy controller', async () => {
			const payload = { userId: 1, enemyUserId: 2 };
			const response = await request(buildApp()).post('/enemies').send(payload);

			expect(response.status).toBe(200);
			expect(response.body.handler).toBe('addEnemy');
			expect(addEnemyMock).toHaveBeenCalledTimes(1);
			expect(addEnemyMock.mock.calls[0][0].body).toEqual(payload);
		});

		test('handles confirmed flag in payload', async () => {
			const payload = { userId: 1, enemyUserId: 2, confirmed: true };
			const response = await request(buildApp()).post('/enemies').send(payload);

			expect(response.status).toBe(200);
			expect(addEnemyMock).toHaveBeenCalledTimes(1);
			expect(addEnemyMock.mock.calls[0][0].body).toEqual(payload);
		});
	});

	describe('POST /enemies/confirm', () => {
		test('routes to confirmAddEnemy controller', async () => {
			const payload = { userId: 1, enemyUserId: 2 };
			const response = await request(buildApp()).post('/enemies/confirm').send(payload);

			expect(response.status).toBe(200);
			expect(response.body.handler).toBe('confirmAddEnemy');
			expect(confirmAddEnemyMock).toHaveBeenCalledTimes(1);
			expect(confirmAddEnemyMock.mock.calls[0][0].body).toEqual(payload);
		});
	});

	describe('DELETE /enemies', () => {
		test('routes to removeEnemy controller', async () => {
			const payload = { userId: 1, enemyUserId: 2 };
			const response = await request(buildApp()).delete('/enemies').send(payload);

			expect(response.status).toBe(200);
			expect(response.body.handler).toBe('removeEnemy');
			expect(removeEnemyMock).toHaveBeenCalledTimes(1);
			expect(removeEnemyMock.mock.calls[0][0].body).toEqual(payload);
		});
	});

	describe('GET /enemies/:userId', () => {
		test('routes to getEnemy controller with userId param', async () => {
			const response = await request(buildApp()).get('/enemies/42');

			expect(response.status).toBe(200);
			expect(response.body.handler).toBe('getEnemy');
			expect(response.body.params.userId).toBe('42');
			expect(getEnemyMock).toHaveBeenCalledTimes(1);
			expect(getEnemyMock.mock.calls[0][0].params.userId).toBe('42');
		});

		test('handles different userId values', async () => {
			const response = await request(buildApp()).get('/enemies/123');

			expect(response.status).toBe(200);
			expect(response.body.params.userId).toBe('123');
			expect(getEnemyMock).toHaveBeenCalledTimes(1);
		});
	});

	describe('GET /enemies', () => {
		test('routes to getEnemiesList controller', async () => {
			const response = await request(buildApp()).get('/enemies');

			expect(response.status).toBe(200);
			expect(response.body.handler).toBe('getEnemiesList');
			expect(getEnemiesListMock).toHaveBeenCalledTimes(1);
		});

		test('does not capture userId param when no path segment provided', async () => {
			const response = await request(buildApp()).get('/enemies');

			expect(response.body.params).toEqual({});
			expect(getEnemiesListMock).toHaveBeenCalledTimes(1);
		});
	});

	describe('GET /enemies/isEnemy/:enemyUserId', () => {
		test('routes to isEnemy controller with enemyUserId param', async () => {
			const response = await request(buildApp()).get('/enemies/isEnemy/99');

			expect(response.status).toBe(200);
			expect(response.body.handler).toBe('isEnemy');
			expect(response.body.params.enemyUserId).toBe('99');
			expect(isEnemyMock).toHaveBeenCalledTimes(1);
			expect(isEnemyMock.mock.calls[0][0].params.enemyUserId).toBe('99');
		});

		test('handles different enemyUserId values', async () => {
			const response = await request(buildApp()).get('/enemies/isEnemy/777');

			expect(response.status).toBe(200);
			expect(response.body.params.enemyUserId).toBe('777');
			expect(isEnemyMock).toHaveBeenCalledTimes(1);
		});
	});

	describe('route precedence and conflicts', () => {
		test('GET /enemies routes to list, not to getEnemy', async () => {
			const response = await request(buildApp()).get('/enemies');

			expect(response.body.handler).toBe('getEnemiesList');
			expect(getEnemiesListMock).toHaveBeenCalledTimes(1);
			expect(getEnemyMock).not.toHaveBeenCalled();
		});

		test('GET /enemies/isEnemy/:enemyUserId routes to isEnemy, not getEnemy', async () => {
			const response = await request(buildApp()).get('/enemies/isEnemy/42');

			expect(response.body.handler).toBe('isEnemy');
			expect(isEnemyMock).toHaveBeenCalledTimes(1);
			expect(getEnemyMock).not.toHaveBeenCalled();
		});

		test('GET /enemies/:userId with numeric ID routes to getEnemy', async () => {
			const response = await request(buildApp()).get('/enemies/42');

			expect(response.body.handler).toBe('getEnemy');
			expect(response.body.params.userId).toBe('42');
			expect(getEnemyMock).toHaveBeenCalledTimes(1);
			expect(isEnemyMock).not.toHaveBeenCalled();
		});
	});

	describe('HTTP method handling', () => {
		test('POST is only supported for /enemies and /enemies/confirm', async () => {
			const app = buildApp();
			
			// Valid POST routes
			const validPost1 = await request(app).post('/enemies').send({ userId: 1, enemyUserId: 2 });
			expect(validPost1.status).toBe(200);

			const validPost2 = await request(app).post('/enemies/confirm').send({ userId: 1, enemyUserId: 2 });
			expect(validPost2.status).toBe(200);
		});

		test('DELETE is only supported for /enemies', async () => {
			const response = await request(buildApp()).delete('/enemies').send({ userId: 1, enemyUserId: 2 });
			expect(response.status).toBe(200);
			expect(removeEnemyMock).toHaveBeenCalledTimes(1);
		});

		test('GET is supported for /enemies, /enemies/:userId, and /enemies/isEnemy/:enemyUserId', async () => {
			const app = buildApp();
			
			const response1 = await request(app).get('/enemies');
			expect(response1.status).toBe(200);

			const response2 = await request(app).get('/enemies/42');
			expect(response2.status).toBe(200);

			const response3 = await request(app).get('/enemies/isEnemy/99');
			expect(response3.status).toBe(200);
		});
	});

	describe('request payload handling', () => {
		test('handles empty request body gracefully', async () => {
			const response = await request(buildApp()).post('/enemies').send({});

			expect(response.status).toBe(200);
			expect(addEnemyMock).toHaveBeenCalledTimes(1);
			expect(addEnemyMock.mock.calls[0][0].body).toEqual({});
		});

		test('preserves all body properties in POST requests', async () => {
			const payload = { 
				userId: 1, 
				enemyUserId: 2, 
				confirmed: true,
				extraField: 'test' 
			};
			const response = await request(buildApp()).post('/enemies').send(payload);

			expect(addEnemyMock.mock.calls[0][0].body).toEqual(payload);
		});

		test('handles JSON parsing in request body', async () => {
			const payload = { userId: 1, enemyUserId: 2 };
			const response = await request(buildApp())
				.post('/enemies')
				.set('Content-Type', 'application/json')
				.send(JSON.stringify(payload));

			expect(response.status).toBe(200);
			expect(addEnemyMock.mock.calls[0][0].body).toEqual(payload);
		});
	});
});
