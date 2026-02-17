import { expect, describe, test, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { awardExperience, XP_REWARDS } from '../services/xpService';

const mockParseValidation = jest.fn<any>();
const mockAddEnemy = jest.fn<any>();
const mockConfirmAddEnemy = jest.fn<any>();
const mockGetEnemy = jest.fn<any>();
const mockRemoveEnemy = jest.fn<any>();
const mockIsEnemy = jest.fn<any>();
const mockGetAllEnemies = jest.fn<any>();
const mockTypeSafeLoggerInfo = jest.fn<any>();
const mockTypeSafeLoggerError = jest.fn<any>();

jest.mock('../utils/validator', () => ({
	parseValidation: mockParseValidation,
}));

jest.mock('../services/enemyService', () => ({
	__esModule: true,
	default: {
		addEnemy: mockAddEnemy,
		confirmAddEnemy: mockConfirmAddEnemy,
		getEnemy: mockGetEnemy,
		removeEnemy: mockRemoveEnemy,
		isEnemy: mockIsEnemy,
		getAllEnemies: mockGetAllEnemies,
	},
}));

jest.mock('../utils/typeSafeLogger', () => ({
	__esModule: true,
	default: {
		info: mockTypeSafeLoggerInfo,
		error: mockTypeSafeLoggerError,
	},
}));

jest.mock('../services/xpService', () => ({
	awardExperience: jest.fn(),
	XP_REWARDS: {
		ADD_ENEMY: 5,
	},
}));

import enemyController from '../controllers/enemyController';

describe('enemyController', () => {
	let mockReq: Partial<Request>;
	let mockRes: any;
	let mockJson: jest.Mock;
	let mockStatus: jest.Mock;
	let mockNext: jest.MockedFunction<NextFunction>;

	beforeEach(() => {
		jest.clearAllMocks();

		mockJson = jest.fn();
		mockStatus = jest.fn().mockReturnValue({ json: mockJson });
		mockReq = { body: {}, params: {} };
		mockRes = { status: mockStatus, json: mockJson } as Partial<Response> as Response;
		mockNext = jest.fn() as unknown as jest.MockedFunction<NextFunction>;
	});

	describe('addEnemy', () => {
		test('adds enemy without confirmation when no existing friendship', async () => {
			const userId = 1;
			const enemyUserId = 2;
			const mockEnemy = { id: 1, ownerId: userId, enemyUserId };

			mockParseValidation.mockReturnValue({ userId, enemyUserId, confirmed: false });
			mockAddEnemy.mockResolvedValue({ 
				requiresConfirmation: false, 
				enemy: mockEnemy 
			});

			await enemyController.addEnemy(mockReq as Request, mockRes as Response, mockNext);

			expect(mockAddEnemy).toHaveBeenCalledWith(userId, enemyUserId);
			expect(mockStatus).toHaveBeenCalledWith(201);
			expect(mockJson).toHaveBeenCalledWith(mockEnemy);
			expect(awardExperience).toHaveBeenCalledWith(userId, XP_REWARDS.ADD_ENEMY, 'add_enemy');
			expect(mockNext).not.toHaveBeenCalled();
			expect(mockTypeSafeLoggerInfo).toHaveBeenCalledWith(
				'addEnemy request received', 
				{ userId, enemyUserId, confirmed: false }
			);
		});

		test('returns 409 when confirmation required (existing friendship)', async () => {
			const userId = 1;
			const enemyUserId = 2;

			mockParseValidation.mockReturnValue({ userId, enemyUserId, confirmed: false });
			mockAddEnemy.mockResolvedValue({
				requiresConfirmation: true,
				message: 'This user is currently your friend',
				existingRelationship: 'FRIEND'
			});

			await enemyController.addEnemy(mockReq as Request, mockRes as Response, mockNext);

			expect(mockAddEnemy).toHaveBeenCalledWith(userId, enemyUserId);
			expect(mockStatus).toHaveBeenCalledWith(409);
			expect(mockJson).toHaveBeenCalledWith({
				requiresConfirmation: true,
				message: 'This user is currently your friend',
				existingRelationship: 'FRIEND'
			});
			expect(mockNext).not.toHaveBeenCalled();
			expect(mockTypeSafeLoggerInfo).toHaveBeenCalledWith(
				'Enemy addition requires confirmation',
				{ userId, enemyUserId, existingRelationship: 'FRIEND' }
			);
		});

		test('executes confirmed add when confirmed flag is true', async () => {
			const userId = 1;
			const enemyUserId = 2;
			const mockEnemy = { id: 1, ownerId: userId, enemyUserId };

			mockParseValidation.mockReturnValue({ userId, enemyUserId, confirmed: true });
			mockConfirmAddEnemy.mockResolvedValue(mockEnemy);

			await enemyController.addEnemy(mockReq as Request, mockRes as Response, mockNext);

			expect(mockConfirmAddEnemy).toHaveBeenCalledWith(userId, enemyUserId);
			expect(mockAddEnemy).not.toHaveBeenCalled();
			expect(mockStatus).toHaveBeenCalledWith(201);
			expect(mockJson).toHaveBeenCalledWith(mockEnemy);
			expect(awardExperience).toHaveBeenCalledWith(userId, XP_REWARDS.ADD_ENEMY, 'add_enemy');
			expect(mockTypeSafeLoggerInfo).toHaveBeenCalledWith(
				'Enemy added with confirmation',
				{ userId, enemyUserId, enemyId: mockEnemy.id }
			);
		});

		test('forwards validation error', async () => {
			const validationError = new AppError('Validation failed', {
				code: 'VALIDATION_ERROR',
				statusCode: 400,
			});
			mockParseValidation.mockImplementation(() => {
				throw validationError;
			});

			await enemyController.addEnemy(mockReq as Request, mockRes as Response, mockNext);

			expect(mockStatus).not.toHaveBeenCalled();
			expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
			expect(mockTypeSafeLoggerError).toHaveBeenCalled();
		});

		test('forwards service error', async () => {
			const userId = 1;
			const enemyUserId = 2;
			const serviceError = new Error('Service error');

			mockParseValidation.mockReturnValue({ userId, enemyUserId, confirmed: false });
			mockAddEnemy.mockRejectedValue(serviceError);

			await enemyController.addEnemy(mockReq as Request, mockRes as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
			expect(mockTypeSafeLoggerError).toHaveBeenCalledWith(
				'Failed to add enemy',
				expect.objectContaining({ error: serviceError })
			);
		});
	});

	describe('confirmAddEnemy', () => {
		test('confirms and adds enemy successfully', async () => {
			const userId = 1;
			const enemyUserId = 2;
			const mockEnemy = { id: 1, ownerId: userId, enemyUserId };

			mockParseValidation.mockReturnValue({ userId, enemyUserId });
			mockConfirmAddEnemy.mockResolvedValue(mockEnemy);

			await enemyController.confirmAddEnemy(mockReq as Request, mockRes as Response, mockNext);

			expect(mockConfirmAddEnemy).toHaveBeenCalledWith(userId, enemyUserId);
			expect(mockStatus).toHaveBeenCalledWith(201);
			expect(mockJson).toHaveBeenCalledWith(mockEnemy);
			expect(awardExperience).toHaveBeenCalledWith(userId, XP_REWARDS.ADD_ENEMY, 'add_enemy');
			expect(mockNext).not.toHaveBeenCalled();
			expect(mockTypeSafeLoggerInfo).toHaveBeenCalledWith(
				'confirmAddEnemy request received',
				{ userId, enemyUserId }
			);
			expect(mockTypeSafeLoggerInfo).toHaveBeenCalledWith(
				'Enemy confirmed and added successfully',
				{ userId, enemyUserId, enemyId: mockEnemy.id }
			);
		});

		test('forwards validation error', async () => {
			const validationError = new AppError('Validation failed', {
				code: 'VALIDATION_ERROR',
				statusCode: 400,
			});
			mockParseValidation.mockImplementation(() => {
				throw validationError;
			});

			await enemyController.confirmAddEnemy(mockReq as Request, mockRes as Response, mockNext);

			expect(mockStatus).not.toHaveBeenCalled();
			expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
			expect(mockTypeSafeLoggerError).toHaveBeenCalled();
		});

		test('forwards service error', async () => {
			const userId = 1;
			const enemyUserId = 2;
			const serviceError = new Error('Service error');

			mockParseValidation.mockReturnValue({ userId, enemyUserId });
			mockConfirmAddEnemy.mockRejectedValue(serviceError);

			await enemyController.confirmAddEnemy(mockReq as Request, mockRes as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
			expect(mockTypeSafeLoggerError).toHaveBeenCalledWith(
				'Failed to confirm adding enemy',
				expect.objectContaining({ error: serviceError })
			);
		});
	});

	describe('getEnemy', () => {
		test('returns enemies list for user', async () => {
			const userId = 1;
			const enemies = [
				{ id: 1, ownerId: userId, enemyUserId: 2 },
				{ id: 2, ownerId: userId, enemyUserId: 3 }
			];

			mockReq.params = { userId: '1' };
			mockParseValidation.mockReturnValue({ userId });
			mockGetEnemy.mockResolvedValue(enemies);

			await enemyController.getEnemy(mockReq as Request, mockRes as Response, mockNext);

			expect(mockGetEnemy).toHaveBeenCalledWith(userId);
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(enemies);
			expect(mockNext).not.toHaveBeenCalled();
			expect(mockTypeSafeLoggerInfo).toHaveBeenCalledWith(
				'Enemies retrieved successfully',
				{ userId, count: enemies.length }
			);
		});

		test('returns empty array when no enemies', async () => {
			const userId = 1;

			mockReq.params = { userId: '1' };
			mockParseValidation.mockReturnValue({ userId });
			mockGetEnemy.mockResolvedValue([]);

			await enemyController.getEnemy(mockReq as Request, mockRes as Response, mockNext);

			expect(mockGetEnemy).toHaveBeenCalledWith(userId);
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith([]);
			expect(mockTypeSafeLoggerInfo).toHaveBeenCalledWith(
				'Enemies retrieved successfully',
				{ userId, count: 0 }
			);
		});

		test('forwards validation error', async () => {
			const validationError = new AppError('Validation failed', {
				code: 'VALIDATION_ERROR',
				statusCode: 400,
			});
			mockReq.params = { userId: 'invalid' };
			mockParseValidation.mockImplementation(() => {
				throw validationError;
			});

			await enemyController.getEnemy(mockReq as Request, mockRes as Response, mockNext);

			expect(mockStatus).not.toHaveBeenCalled();
			expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
			expect(mockTypeSafeLoggerError).toHaveBeenCalled();
		});

		test('forwards service error', async () => {
			const userId = 1;
			const serviceError = new Error('Service error');

			mockReq.params = { userId: '1' };
			mockParseValidation.mockReturnValue({ userId });
			mockGetEnemy.mockRejectedValue(serviceError);

			await enemyController.getEnemy(mockReq as Request, mockRes as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
			expect(mockTypeSafeLoggerError).toHaveBeenCalledWith(
				'Failed to get enemies',
				expect.objectContaining({ error: serviceError })
			);
		});
	});

	describe('removeEnemy', () => {
		test('removes enemy successfully', async () => {
			const userId = 1;
			const enemyUserId = 2;

			mockParseValidation.mockReturnValue({ userId, enemyUserId });
			mockRemoveEnemy.mockResolvedValue(undefined);

			await enemyController.removeEnemy(mockReq as Request, mockRes as Response, mockNext);

			expect(mockRemoveEnemy).toHaveBeenCalledWith(userId, enemyUserId);
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith({ message: 'Enemy removed successfully' });
			expect(mockNext).not.toHaveBeenCalled();
			expect(mockTypeSafeLoggerInfo).toHaveBeenCalledWith(
				'Enemy removed successfully',
				{ userId, enemyUserId }
			);
		});

		test('forwards validation error', async () => {
			const validationError = new AppError('Validation failed', {
				code: 'VALIDATION_ERROR',
				statusCode: 400,
			});
			mockParseValidation.mockImplementation(() => {
				throw validationError;
			});

			await enemyController.removeEnemy(mockReq as Request, mockRes as Response, mockNext);

			expect(mockStatus).not.toHaveBeenCalled();
			expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
			expect(mockTypeSafeLoggerError).toHaveBeenCalled();
		});

		test('forwards service error when enemy not found', async () => {
			const userId = 1;
			const enemyUserId = 2;
			const serviceError = new AppError('Enemy relationship not found', {
				code: 'NOT_FOUND',
				statusCode: 404,
			});

			mockParseValidation.mockReturnValue({ userId, enemyUserId });
			mockRemoveEnemy.mockRejectedValue(serviceError);

			await enemyController.removeEnemy(mockReq as Request, mockRes as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
			expect(mockTypeSafeLoggerError).toHaveBeenCalledWith(
				'Failed to remove enemy',
				expect.objectContaining({ error: serviceError })
			);
		});
	});

	describe('isEnemy', () => {
		test('returns true when users are enemies', async () => {
			const userId = 1;
			const enemyUserId = 2;

			mockReq.user = { id: userId } as any;
			mockReq.params = { enemyUserId: '2' };
			mockParseValidation.mockReturnValue({ userId, enemyUserId });
			mockIsEnemy.mockResolvedValue(true);

			await enemyController.isEnemy(mockReq as Request, mockRes as Response, mockNext);

			expect(mockIsEnemy).toHaveBeenCalledWith(userId, enemyUserId);
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith({ isEnemy: true });
			expect(mockNext).not.toHaveBeenCalled();
			expect(mockTypeSafeLoggerInfo).toHaveBeenCalledWith(
				'Enemy status checked',
				{ userId, enemyUserId, isEnemy: true }
			);
		});

		test('returns false when users are not enemies', async () => {
			const userId = 1;
			const enemyUserId = 2;

			mockReq.user = { id: userId } as any;
			mockReq.params = { enemyUserId: '2' };
			mockParseValidation.mockReturnValue({ userId, enemyUserId });
			mockIsEnemy.mockResolvedValue(false);

			await enemyController.isEnemy(mockReq as Request, mockRes as Response, mockNext);

			expect(mockIsEnemy).toHaveBeenCalledWith(userId, enemyUserId);
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith({ isEnemy: false });
			expect(mockTypeSafeLoggerInfo).toHaveBeenCalledWith(
				'Enemy status checked',
				{ userId, enemyUserId, isEnemy: false }
			);
		});

		test('forwards validation error', async () => {
			const validationError = new AppError('Validation failed', {
				code: 'VALIDATION_ERROR',
				statusCode: 400,
			});
			mockReq.user = { id: 1 } as any;
			mockReq.params = { enemyUserId: 'invalid' };
			mockParseValidation.mockImplementation(() => {
				throw validationError;
			});

			await enemyController.isEnemy(mockReq as Request, mockRes as Response, mockNext);

			expect(mockStatus).not.toHaveBeenCalled();
			expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
			expect(mockTypeSafeLoggerError).toHaveBeenCalled();
		});

		test('forwards service error', async () => {
			const userId = 1;
			const enemyUserId = 2;
			const serviceError = new Error('Service error');

			mockReq.user = { id: userId } as any;
			mockReq.params = { enemyUserId: '2' };
			mockParseValidation.mockReturnValue({ userId, enemyUserId });
			mockIsEnemy.mockRejectedValue(serviceError);

			await enemyController.isEnemy(mockReq as Request, mockRes as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
			expect(mockTypeSafeLoggerError).toHaveBeenCalledWith(
				'Failed to check enemy status',
				expect.objectContaining({ error: serviceError })
			);
		});
	});

	describe('getEnemiesList', () => {
		test('returns all enemies in the system', async () => {
			const allEnemies = [
				{ id: 1, ownerId: 1, enemyUserId: 2 },
				{ id: 2, ownerId: 2, enemyUserId: 3 },
				{ id: 3, ownerId: 3, enemyUserId: 1 }
			];

			mockGetAllEnemies.mockResolvedValue(allEnemies);

			await enemyController.getEnemiesList(mockReq as Request, mockRes as Response, mockNext);

			expect(mockGetAllEnemies).toHaveBeenCalled();
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(allEnemies);
			expect(mockNext).not.toHaveBeenCalled();
			expect(mockTypeSafeLoggerInfo).toHaveBeenCalledWith(
				'Enemies list retrieved successfully',
				{ count: allEnemies.length }
			);
		});

		test('returns empty array when no enemies exist', async () => {
			mockGetAllEnemies.mockResolvedValue([]);

			await enemyController.getEnemiesList(mockReq as Request, mockRes as Response, mockNext);

			expect(mockGetAllEnemies).toHaveBeenCalled();
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith([]);
			expect(mockTypeSafeLoggerInfo).toHaveBeenCalledWith(
				'Enemies list retrieved successfully',
				{ count: 0 }
			);
		});

		test('forwards service error', async () => {
			const serviceError = new Error('Service error');

			mockGetAllEnemies.mockRejectedValue(serviceError);

			await enemyController.getEnemiesList(mockReq as Request, mockRes as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
			expect(mockTypeSafeLoggerError).toHaveBeenCalledWith(
				'Failed to get enemies list',
				expect.objectContaining({ error: serviceError })
			);
		});
	});
});
