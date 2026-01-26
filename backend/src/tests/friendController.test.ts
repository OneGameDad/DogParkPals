import { expect, describe, test, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

const mockParseValidation = jest.fn<any>();
const mockSendFriendRequest = jest.fn<any>();
const mockAcceptFriendRequest = jest.fn<any>();
const mockDeclineFriendRequest = jest.fn<any>();
const mockRemoveFriend = jest.fn<any>();
const mockGetFriendsList = jest.fn<any>();
const mockGetFriend = jest.fn<any>();
const mockIsEnemy = jest.fn<any>();
const mockRemoveEnemy = jest.fn<any>();
const mockAwardExperience = jest.fn<any>();

jest.mock('../utils/validator', () => ({
	parseValidation: mockParseValidation,
}));

jest.mock('../services/friendService', () => ({
	__esModule: true,
	default: {
		sendFriendRequest: mockSendFriendRequest,
		acceptFriendRequest: mockAcceptFriendRequest,
		declineFriendRequest: mockDeclineFriendRequest,
		removeFriend: mockRemoveFriend,
		getFriendsList: mockGetFriendsList,
		getFriend: mockGetFriend,
	},
}));

jest.mock('../services/enemyService', () => ({
	__esModule: true,
	default: {
		isEnemy: mockIsEnemy,
		removeEnemy: mockRemoveEnemy,
	},
}));

jest.mock('../services/xpService', () => ({
	__esModule: true,
	awardExperience: mockAwardExperience,
	XP_REWARDS: { ADD_FRIEND: 25 },
}));

import friendController from '../controllers/friendController';

describe('friendController', () => {
	let mockReq: Partial<Request>;
	let mockRes: any;
	let mockJson: jest.Mock;
	let mockStatus: jest.Mock;
	let mockNext: jest.MockedFunction<NextFunction>;

	beforeEach(() => {
		jest.clearAllMocks();

		mockJson = jest.fn();
		mockStatus = jest.fn().mockImplementation(() => mockRes);
		mockReq = { body: {}, params: {}, query: {}, cookies: {} };
		mockRes = { status: mockStatus, json: mockJson, cookie: jest.fn(), clearCookie: jest.fn() } as Partial<Response> as Response;
		mockNext = jest.fn() as unknown as jest.MockedFunction<NextFunction>;

		mockAwardExperience.mockResolvedValue({ totalExp: 0, level: null });
	});

	describe('addFriend', () => {
		test('creates friend request successfully', async () => {
			const requesterId = 1;
			const addresseeId = 2;
			const requesterDogId = undefined;
			const addresseeDogId = undefined;
			const mockFriendship = { id: 1, requesterId, addresseeId, requesterDogId: null, addresseeDogId: null, status: 'PENDING' };

			mockParseValidation.mockReturnValue({ requesterId, addresseeId, requesterDogId, addresseeDogId });
			mockIsEnemy.mockResolvedValue(false);
			mockSendFriendRequest.mockResolvedValueOnce(mockFriendship);

			await friendController.addFriend(mockReq as Request, mockRes as Response, mockNext);

			expect(mockIsEnemy).toHaveBeenCalledWith(requesterId, addresseeId);
			expect(mockSendFriendRequest).toHaveBeenCalledWith(requesterId, addresseeId, requesterDogId, addresseeDogId);
			expect(mockStatus).toHaveBeenCalledWith(201);
			expect(mockJson).toHaveBeenCalledWith(mockFriendship);
			expect(mockNext).not.toHaveBeenCalled();
		});

		test('requires confirmation when addressee is on enemy list', async () => {
			const requesterId = 1;
			const addresseeId = 2;
			const requesterDogId = undefined;
			const addresseeDogId = undefined;

			mockParseValidation.mockReturnValue({ requesterId, addresseeId, requesterDogId, addresseeDogId, confirmRemoveEnemy: false });
			mockIsEnemy.mockResolvedValue(true);

			await friendController.addFriend(mockReq as Request, mockRes as Response, mockNext);

			expect(mockIsEnemy).toHaveBeenCalledWith(requesterId, addresseeId);
			expect(mockRemoveEnemy).not.toHaveBeenCalled();
			expect(mockSendFriendRequest).not.toHaveBeenCalled();
			expect(mockStatus).toHaveBeenCalledWith(409);
			expect(mockJson).toHaveBeenCalledWith({
				requiresConfirmation: true,
				message: 'This user is currently on your enemy list. Adding as friend will remove them from enemies.',
				existingRelationship: 'enemy',
				code: 'ENEMY_CONFIRMATION_REQUIRED'
			});
		});

		test('removes enemy and adds friend when confirmation provided', async () => {
			const requesterId = 1;
			const addresseeId = 2;
			const requesterDogId = undefined;
			const addresseeDogId = undefined;
			const mockFriendship = { id: 1, requesterId, addresseeId, requesterDogId: null, addresseeDogId: null, status: 'PENDING' };

			mockParseValidation.mockReturnValue({ requesterId, addresseeId, requesterDogId, addresseeDogId, confirmRemoveEnemy: true });
			mockIsEnemy.mockResolvedValue(true);
			mockRemoveEnemy.mockResolvedValue(undefined);
			mockSendFriendRequest.mockResolvedValueOnce(mockFriendship);

			await friendController.addFriend(mockReq as Request, mockRes as Response, mockNext);

			expect(mockIsEnemy).toHaveBeenCalledWith(requesterId, addresseeId);
			expect(mockRemoveEnemy).toHaveBeenCalledWith(requesterId, addresseeId);
			expect(mockSendFriendRequest).toHaveBeenCalledWith(requesterId, addresseeId, requesterDogId, addresseeDogId);
			expect(mockStatus).toHaveBeenCalledWith(201);
			expect(mockJson).toHaveBeenCalledWith(mockFriendship);
		});

		test('skips enemy check for dog friendships', async () => {
			const requesterId = undefined;
			const addresseeId = undefined;
			const requesterDogId = 1;
			const addresseeDogId = 2;
			const mockFriendship = { id: 1, requesterId: null, addresseeId: null, requesterDogId, addresseeDogId, status: 'ACCEPTED' };

			mockParseValidation.mockReturnValue({ requesterId, addresseeId, requesterDogId, addresseeDogId });
			mockSendFriendRequest.mockResolvedValueOnce(mockFriendship);

			await friendController.addFriend(mockReq as Request, mockRes as Response, mockNext);

			expect(mockIsEnemy).not.toHaveBeenCalled();
			expect(mockSendFriendRequest).toHaveBeenCalledWith(requesterId, addresseeId, requesterDogId, addresseeDogId);
			expect(mockStatus).toHaveBeenCalledWith(201);
			expect(mockJson).toHaveBeenCalledWith(mockFriendship);
		});

		test('forwards validation error', async () => {
			const validationError = new AppError('Validation failed', {
				code: 'VALIDATION_ERROR',
				statusCode: 400,
			});
			mockParseValidation.mockImplementation(() => {
				throw validationError;
			});

			await friendController.addFriend(mockReq as Request, mockRes as Response, mockNext);

			expect(mockStatus).not.toHaveBeenCalled();
			expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
		});
	});

	describe('acceptFriendRequest', () => {
		test('accepts request successfully', async () => {
			const friendshipId = 1;
			const updated = { id: friendshipId, requesterId: 1, addresseeId: 2, requesterDogId: null, addresseeDogId: null, status: 'ACCEPTED' };

			mockParseValidation.mockReturnValue({ friendshipId });
			mockAcceptFriendRequest.mockResolvedValue(updated);

			await friendController.acceptFriendRequest(mockReq as Request, mockRes as Response, mockNext);

			expect(mockAcceptFriendRequest).toHaveBeenCalledWith(friendshipId);
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(updated);
		});

		test('forwards validation error', async () => {
			const validationError = new AppError('Validation failed', {
				code: 'VALIDATION_ERROR',
				statusCode: 400,
			});
			mockParseValidation.mockImplementation(() => {
				throw validationError;
			});

			await friendController.acceptFriendRequest(mockReq as Request, mockRes as Response, mockNext);

			expect(mockStatus).not.toHaveBeenCalled();
			expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
		});
	});

	describe('declineFriendRequest', () => {
		test('declines request successfully', async () => {
			const friendshipId = 1;
			const updated = { id: friendshipId, requesterId: 1, addresseeId: 2, requesterDogId: null, addresseeDogId: null, status: 'REJECTED' };

			mockParseValidation.mockReturnValue({ friendshipId });
			mockDeclineFriendRequest.mockResolvedValue(updated);

			await friendController.declineFriendRequest(mockReq as Request, mockRes as Response, mockNext);

			expect(mockDeclineFriendRequest).toHaveBeenCalledWith(friendshipId);
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(updated);
		});

		test('forwards validation error', async () => {
			const validationError = new AppError('Validation failed', {
				code: 'VALIDATION_ERROR',
				statusCode: 400,
			});
			mockParseValidation.mockImplementation(() => {
				throw validationError;
			});

			await friendController.declineFriendRequest(mockReq as Request, mockRes as Response, mockNext);

			expect(mockStatus).not.toHaveBeenCalled();
			expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
		});
	});

	describe('removeFriend', () => {
		test('removes friendship successfully', async () => {
			const userId = 1;
			const friendId = 2;
			const dogId = undefined;
			const friendDogId = undefined;

			mockParseValidation.mockReturnValue({ userId, friendId, dogId, friendDogId });
			mockRemoveFriend.mockResolvedValueOnce({ count: 1 });

			await friendController.removeFriend(mockReq as Request, mockRes as Response, mockNext);

			expect(mockRemoveFriend).toHaveBeenCalledWith(userId, friendId, dogId, friendDogId);
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith({ message: 'Friend removed successfully' });
		});

		test('forwards validation error', async () => {
			const validationError = new AppError('Validation failed', {
				code: 'VALIDATION_ERROR',
				statusCode: 400,
			});
			mockParseValidation.mockImplementation(() => {
				throw validationError;
			});

			await friendController.removeFriend(mockReq as Request, mockRes as Response, mockNext);

			expect(mockStatus).not.toHaveBeenCalled();
			expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
		});
	});

	describe('getFriendsList', () => {
		test('returns friends list', async () => {
			const userId = 1;
			const dogId = undefined;
			const friends = { users: [{ id: 2 }, { id: 3 }], dogs: [] };

			mockReq.query = { userId: '1' };
			mockParseValidation.mockReturnValue({ userId, dogId });
			mockGetFriendsList.mockResolvedValue(friends);

			await friendController.getFriendsList(mockReq as Request, mockRes as Response, mockNext);

			expect(mockGetFriendsList).toHaveBeenCalledWith(userId, dogId);
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(friends);
		});

		test('forwards validation error', async () => {
			const validationError = new AppError('Validation failed', {
				code: 'VALIDATION_ERROR',
				statusCode: 400,
			});
			mockParseValidation.mockImplementation(() => {
				throw validationError;
			});

			await friendController.getFriendsList(mockReq as Request, mockRes as Response, mockNext);

			expect(mockStatus).not.toHaveBeenCalled();
			expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
		});
	});

	describe('getFriend', () => {
		test('returns friends when requested', async () => {
			const userId = 1;
			const dogId = undefined;
			const friends = { users: [{ id: 2 }], dogs: [] };

			mockReq.query = { userId: '1' };
			mockParseValidation.mockReturnValue({ userId, dogId });
			mockGetFriend.mockResolvedValue(friends);

			await friendController.getFriend(mockReq as Request, mockRes as Response, mockNext);

			expect(mockGetFriend).toHaveBeenCalledWith(userId, dogId);
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(friends);
		});

		test('forwards validation error', async () => {
			const validationError = new AppError('Validation failed', {
				code: 'VALIDATION_ERROR',
				statusCode: 400,
			});
			mockParseValidation.mockImplementation(() => {
				throw validationError;
			});

			await friendController.getFriend(mockReq as Request, mockRes as Response, mockNext);

			expect(mockStatus).not.toHaveBeenCalled();
			expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
		});
	});
});
