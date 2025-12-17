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
		mockStatus = jest.fn().mockReturnValue({ json: mockJson });
		mockReq = { body: {}, params: {} };
		mockRes = { status: mockStatus, json: mockJson } as Partial<Response> as Response;
		mockNext = jest.fn() as unknown as jest.MockedFunction<NextFunction>;
	});

	describe('addFriend', () => {
		test('creates friend request successfully', async () => {
			const requesterId = 1;
			const addresseeId = 2;
			const mockFriendship = { requesterId, addresseeId, status: 'PENDING' };

			mockParseValidation
				.mockReturnValueOnce({ requesterId, addresseeId })
				.mockReturnValueOnce({ requesterId, addresseeId });
			mockGetFriend.mockResolvedValueOnce([]);
			mockSendFriendRequest.mockResolvedValueOnce(mockFriendship);

			await friendController.addFriend(mockReq as Request, mockRes as Response, mockNext);

			expect(mockSendFriendRequest).toHaveBeenCalledWith(requesterId, addresseeId);
			expect(mockStatus).toHaveBeenCalledWith(201);
			expect(mockJson).toHaveBeenCalledWith(mockFriendship);
			expect(mockNext).not.toHaveBeenCalled();
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
			const requesterId = 1;
			const addresseeId = 2;
			const updated = { requesterId, addresseeId, status: 'ACCEPTED' };

			mockParseValidation.mockReturnValue({ requesterId, addresseeId });
			mockAcceptFriendRequest.mockResolvedValue(updated);

			await friendController.acceptFriendRequest(mockReq as Request, mockRes as Response, mockNext);

			expect(mockAcceptFriendRequest).toHaveBeenCalledWith(requesterId, addresseeId);
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
			const requesterId = 1;
			const addresseeId = 2;
			const updated = { requesterId, addresseeId, status: 'REJECTED' };

			mockParseValidation.mockReturnValue({ requesterId, addresseeId });
			mockDeclineFriendRequest.mockResolvedValue(updated);

			await friendController.declineFriendRequest(mockReq as Request, mockRes as Response, mockNext);

			expect(mockDeclineFriendRequest).toHaveBeenCalledWith(requesterId, addresseeId);
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

			mockParseValidation
				.mockReturnValueOnce({ userId, friendId })
				.mockReturnValueOnce({ userId, friendId });
			mockGetFriend.mockResolvedValueOnce([{ id: friendId }]);
			mockRemoveFriend.mockResolvedValueOnce({ count: 1 });

			await friendController.removeFriend(mockReq as Request, mockRes as Response, mockNext);

			expect(mockRemoveFriend).toHaveBeenCalledWith(userId, friendId);
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith({ message: 'Friend removed successfully' });
		});

		test('forwards not found when friendship missing', async () => {
			const userId = 1;
			const friendId = 2;

			mockParseValidation.mockReturnValue({ userId, friendId });
			mockGetFriend.mockResolvedValueOnce([]);

			await friendController.removeFriend(mockReq as Request, mockRes as Response, mockNext);

			expect(mockRemoveFriend).not.toHaveBeenCalled();
			expect(mockNext).toHaveBeenCalled();
		});
	});

	describe('getFriendsList', () => {
		test('returns friends list', async () => {
			const userId = 1;
			const friends = [{ id: 2 }, { id: 3 }];

			mockParseValidation.mockReturnValue({ userId });
			mockGetFriendsList.mockResolvedValue(friends);

			await friendController.getFriendsList(mockReq as Request, mockRes as Response, mockNext);

			expect(mockGetFriendsList).toHaveBeenCalledWith(userId);
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
		test('returns single friend when exists', async () => {
			const userId = 1;
			const friendId = 2;
			const friends = [{ id: friendId }];

			mockParseValidation
				.mockReturnValueOnce({ userId, friendId })
				.mockReturnValueOnce({ userId });
			mockGetFriend.mockResolvedValueOnce(friends).mockResolvedValueOnce(friends);

			await friendController.getFriend(mockReq as Request, mockRes as Response, mockNext);

			expect(mockGetFriend).toHaveBeenCalledWith(userId);
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(friends);
		});

		test('forwards not found when friendship missing', async () => {
			const userId = 1;
			const friendId = 2;

			mockParseValidation.mockReturnValueOnce({ userId, friendId });
			mockGetFriend.mockResolvedValueOnce([]);

			await friendController.getFriend(mockReq as Request, mockRes as Response, mockNext);

			expect(mockStatus).not.toHaveBeenCalled();
			expect(mockNext).toHaveBeenCalled();
		});
	});
});
