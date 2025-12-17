import { PrismaClient } from '@prisma/client';
import typeSafeLogger from '../utils/typeSafeLogger';
import { toAppError } from '../utils/errors';
import { createFriendRequestSchema, getUserIdSchema, removeFriendSchema } from '../utils/validationSchemas';

const prisma = new PrismaClient();

//TODO friendService.ts
// Implement friend-related services such as sending friend requests, accepting/declining requests, removing friends, etc.
const friendService = {
  // Example method: sendFriendRequest
  async sendFriendRequest(requesterId: number, addresseeId: number) {
    typeSafeLogger.logUserAction('Sending friend request', { requesterId, addresseeId });
    try {
      // Validate input data
      const validatedData = createFriendRequestSchema.parse({
        requesterId,
        addresseeId,
      });

      const friendRequest = await prisma.friendship.create({
        data: {
          requesterId: validatedData.requesterId,
          addresseeId: validatedData.addresseeId,
          status: 'PENDING',
        },
      });
      typeSafeLogger.logUserAction('Friend request sent successfully', { requesterId, addresseeId });
      return friendRequest;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to send friend request',
        code: 'SEND_FRIEND_REQUEST_FAILED',
      });
      typeSafeLogger.logError('Failed to send friend request', appError, { requesterId, addresseeId });
      throw appError;
    }
  },

  async acceptFriendRequest(requesterId: number, addresseeId: number) {
    typeSafeLogger.logUserAction('Accepting friend request', { requesterId, addresseeId });
    try {
      const updatedRequest = await prisma.friendship.update({
        where: {
          requesterId_addresseeId: {
            requesterId,
            addresseeId,
          },
        },
        data: { status: 'ACCEPTED' },
      });
      typeSafeLogger.logUserAction('Friend request accepted', { requesterId, addresseeId });
      return updatedRequest;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to accept friend request',
        code: 'ACCEPT_FRIEND_REQUEST_FAILED',
      });
      typeSafeLogger.logError('Failed to accept friend request', appError, { requesterId, addresseeId });
      throw appError;
    }
  },

  async declineFriendRequest(requesterId: number, addresseeId: number) {
    typeSafeLogger.logUserAction('Declining friend request', { requesterId, addresseeId });
    try {
      const updatedRequest = await prisma.friendship.update({
        where: {
          requesterId_addresseeId: {
            requesterId,
            addresseeId,
          },
        },
        data: { status: 'REJECTED' },
      });
      typeSafeLogger.logUserAction('Friend request declined', { requesterId, addresseeId });
      return updatedRequest;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to decline friend request',
        code: 'DECLINE_FRIEND_REQUEST_FAILED',
      });
      typeSafeLogger.logError('Failed to decline friend request', appError, { requesterId, addresseeId });
      throw appError;
    }
  },

    async removeFriend (userId: number, friendId: number) {
    typeSafeLogger.logUserAction('Removing friend', { userId, friendId });
    try {
      // Validate input data
      const validatedData = removeFriendSchema.parse({ userId, friendId });

      const deletedFriendship = await prisma.friendship.deleteMany({
        where: {
          OR: [
            { requesterId: validatedData.userId, addresseeId: validatedData.friendId },
            { requesterId: validatedData.friendId, addresseeId: validatedData.userId },
          ],
        },
      });
      typeSafeLogger.logUserAction('Friend removed successfully', { userId: validatedData.userId, friendId: validatedData.friendId });
      return deletedFriendship;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to remove friend',
        code: 'REMOVE_FRIEND_FAILED',
      });
      typeSafeLogger.logError('Failed to remove friend', appError, { userId, friendId });
      throw appError;
    }
  },

  async getFriendsList(userId: number) {
    typeSafeLogger.logUserAction('Fetching friends list', { userId });
    try {
      // Validate input data
      const validatedData = getUserIdSchema.parse({ userId });

      const friendships = await prisma.friendship.findMany({
        where: {
          AND: [
            {
              OR: [
                { requesterId: validatedData.userId },
                { addresseeId: validatedData.userId },
              ],
            },
            { status: 'ACCEPTED' },
          ],
        },
      });

      const friendIds = friendships.map(f => (f.requesterId === validatedData.userId ? f.addresseeId : f.requesterId));
      const friends = await prisma.user.findMany({
        where: { id: { in: friendIds } },
      });

      typeSafeLogger.logUserAction('Friends list fetched successfully', { userId: validatedData.userId, friendsCount: friends.length });
      return friends;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch friends list',
        code: 'FETCH_FRIENDS_LIST_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch friends list', appError, { userId });
      throw appError;
    }
  },

    async getFriend(userId: number) {
    typeSafeLogger.logUserAction('Fetching friends', { userId });
    try {
      // Validate input data
      const validatedData = getUserIdSchema.parse({ userId });

      const friendships = await prisma.friendship.findMany({
        where: {
          AND: [
            {
              OR: [
                { requesterId: validatedData.userId },
                { addresseeId: validatedData.userId },
              ],
            },
            { status: 'ACCEPTED' },
          ],
        },
      });

      const friendIds = friendships.map(f => (f.requesterId === validatedData.userId ? f.addresseeId : f.requesterId));
      const friends = await prisma.user.findMany({
        where: { id: { in: friendIds } },
      });

      typeSafeLogger.logUserAction('Friends fetched successfully', { userId: validatedData.userId, friendsCount: friends.length });
      return friends;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch friends',
        code: 'FETCH_FRIENDS_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch friends', appError, { userId });
      throw appError;
    }
  },
};

export default friendService;