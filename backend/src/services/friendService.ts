import { PrismaClient } from '@prisma/client';
import typeSafeLogger from '../utils/typeSafeLogger';
import { toAppError } from '../utils/errors';
import { createFriendRequestSchema, removeFriendSchema, friendshipIdSchema, getFriendsSchema } from '../utils/validationSchemas';

const prisma = new PrismaClient();

//TODO friendService.ts
// Implement friend-related services such as sending friend requests, accepting/declining requests, removing friends, etc.
const friendService = {
  // Send friend request (supports users and dogs)
  async sendFriendRequest(
    requesterId?: number,
    addresseeId?: number,
    requesterDogId?: number,
    addresseeDogId?: number
  ) {
    typeSafeLogger.logUserAction('Sending friend request', { requesterId, addresseeId, requesterDogId, addresseeDogId });
    try {
      // Validate input data
      const validatedData = createFriendRequestSchema.parse({
        requesterId,
        addresseeId,
        requesterDogId,
        addresseeDogId,
      });

      // Auto-accept if any dog is involved
      const involvingDogs = validatedData.requesterDogId || validatedData.addresseeDogId;
      const status = involvingDogs ? 'ACCEPTED' : 'PENDING';

      const friendRequest = await prisma.friendship.create({
        data: {
          requesterId: validatedData.requesterId || null,
          addresseeId: validatedData.addresseeId || null,
          requesterDogId: validatedData.requesterDogId || null,
          addresseeDogId: validatedData.addresseeDogId || null,
          status,
        },
      });
      typeSafeLogger.logUserAction('Friend request sent successfully', { 
        requesterId, 
        addresseeId, 
        requesterDogId, 
        addresseeDogId,
        status 
      });
      return friendRequest;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to send friend request',
        code: 'SEND_FRIEND_REQUEST_FAILED',
      });
      typeSafeLogger.logError('Failed to send friend request', appError, { 
        requesterId, 
        addresseeId,
        requesterDogId,
        addresseeDogId 
      });
      throw appError;
    }
  },

  async acceptFriendRequest(friendshipId: number) {
    typeSafeLogger.logUserAction('Accepting friend request', { friendshipId });
    try {
      // Validate input data
      const validatedData = friendshipIdSchema.parse({ friendshipId });

      const updatedRequest = await prisma.friendship.update({
        where: { id: validatedData.friendshipId },
        data: { status: 'ACCEPTED' },
      });
      typeSafeLogger.logUserAction('Friend request accepted', { friendshipId });
      return updatedRequest;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to accept friend request',
        code: 'ACCEPT_FRIEND_REQUEST_FAILED',
      });
      typeSafeLogger.logError('Failed to accept friend request', appError, { friendshipId });
      throw appError;
    }
  },

  async declineFriendRequest(friendshipId: number) {
    typeSafeLogger.logUserAction('Declining friend request', { friendshipId });
    try {
      // Validate input data
      const validatedData = friendshipIdSchema.parse({ friendshipId });

      const updatedRequest = await prisma.friendship.update({
        where: { id: validatedData.friendshipId },
        data: { status: 'REJECTED' },
      });
      typeSafeLogger.logUserAction('Friend request declined', { friendshipId });
      return updatedRequest;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to decline friend request',
        code: 'DECLINE_FRIEND_REQUEST_FAILED',
      });
      typeSafeLogger.logError('Failed to decline friend request', appError, { friendshipId });
      throw appError;
    }
  },

  async removeFriend(userId?: number, friendId?: number, dogId?: number, friendDogId?: number) {
    typeSafeLogger.logUserAction('Removing friend', { userId, friendId, dogId, friendDogId });
    try {
      // Validate input data
      const validatedData = removeFriendSchema.parse({ userId, friendId, dogId, friendDogId });

      const deletedFriendship = await prisma.friendship.deleteMany({
        where: {
          OR: [
            // User to User
            { 
              requesterId: validatedData.userId || undefined, 
              addresseeId: validatedData.friendId || undefined,
              requesterDogId: null,
              addresseeDogId: null
            },
            { 
              requesterId: validatedData.friendId || undefined, 
              addresseeId: validatedData.userId || undefined,
              requesterDogId: null,
              addresseeDogId: null
            },
            // User to Dog
            { 
              requesterId: validatedData.userId || undefined, 
              addresseeDogId: validatedData.friendDogId || undefined 
            },
            { 
              addresseeId: validatedData.userId || undefined, 
              requesterDogId: validatedData.friendDogId || undefined 
            },
            // Dog to User
            { 
              requesterDogId: validatedData.dogId || undefined, 
              addresseeId: validatedData.friendId || undefined 
            },
            { 
              addresseeDogId: validatedData.dogId || undefined, 
              requesterId: validatedData.friendId || undefined 
            },
            // Dog to Dog
            { 
              requesterDogId: validatedData.dogId || undefined, 
              addresseeDogId: validatedData.friendDogId || undefined 
            },
            { 
              requesterDogId: validatedData.friendDogId || undefined, 
              addresseeDogId: validatedData.dogId || undefined 
            },
          ],
        },
      });
      typeSafeLogger.logUserAction('Friend removed successfully', { userId, friendId, dogId, friendDogId });
      return deletedFriendship;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to remove friend',
        code: 'REMOVE_FRIEND_FAILED',
      });
      typeSafeLogger.logError('Failed to remove friend', appError, { userId, friendId, dogId, friendDogId });
      throw appError;
    }
  },

  async getFriendsList(userId?: number, dogId?: number) {
    typeSafeLogger.logUserAction('Fetching friends list', { userId, dogId });
    try {
      // Validate input data
      const validatedData = getFriendsSchema.parse({ userId, dogId });

      const friendships = await prisma.friendship.findMany({
        where: {
          AND: [
            {
              OR: [
                { requesterId: validatedData.userId || undefined },
                { addresseeId: validatedData.userId || undefined },
                { requesterDogId: validatedData.dogId || undefined },
                { addresseeDogId: validatedData.dogId || undefined },
              ],
            },
            { status: 'ACCEPTED' },
          ],
        },
        include: {
          requester: true,
          addressee: true,
          requesterDog: true,
          addresseeDog: true,
        },
      });

      // Extract friend users and dogs
      const friendUsers = [];
      const friendDogs = [];

      for (const friendship of friendships) {
        // If current entity is the requester
        if ((validatedData.userId && friendship.requesterId === validatedData.userId) || (validatedData.dogId && friendship.requesterDogId === validatedData.dogId)) {
          if (friendship.addressee) friendUsers.push(friendship.addressee);
          if (friendship.addresseeDog) friendDogs.push(friendship.addresseeDog);
        }
        // If current entity is the addressee
        else {
          if (friendship.requester) friendUsers.push(friendship.requester);
          if (friendship.requesterDog) friendDogs.push(friendship.requesterDog);
        }
      }

      typeSafeLogger.logUserAction('Friends list fetched successfully', { 
        userId, 
        dogId, 
        userFriendsCount: friendUsers.length,
        dogFriendsCount: friendDogs.length 
      });
      return { users: friendUsers, dogs: friendDogs };
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch friends list',
        code: 'FETCH_FRIENDS_LIST_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch friends list', appError, { userId, dogId });
      throw appError;
    }
  },

  async getFriend(userId?: number, dogId?: number) {
    typeSafeLogger.logUserAction('Fetching friends', { userId, dogId });
    try {
      // Validate input data
      const validatedData = getFriendsSchema.parse({ userId, dogId });

      const friendships = await prisma.friendship.findMany({
        where: {
          AND: [
            {
              OR: [
                { requesterId: validatedData.userId || undefined },
                { addresseeId: validatedData.userId || undefined },
                { requesterDogId: validatedData.dogId || undefined },
                { addresseeDogId: validatedData.dogId || undefined },
              ],
            },
            { status: 'ACCEPTED' },
          ],
        },
        include: {
          requester: true,
          addressee: true,
          requesterDog: true,
          addresseeDog: true,
        },
      });

      // Extract friend users and dogs
      const friendUsers = [];
      const friendDogs = [];

      for (const friendship of friendships) {
        // If current entity is the requester
        if ((validatedData.userId && friendship.requesterId === validatedData.userId) || (validatedData.dogId && friendship.requesterDogId === validatedData.dogId)) {
          if (friendship.addressee) friendUsers.push(friendship.addressee);
          if (friendship.addresseeDog) friendDogs.push(friendship.addresseeDog);
        }
        // If current entity is the addressee
        else {
          if (friendship.requester) friendUsers.push(friendship.requester);
          if (friendship.requesterDog) friendDogs.push(friendship.requesterDog);
        }
      }

      typeSafeLogger.logUserAction('Friends fetched successfully', { 
        userId, 
        dogId,
        userFriendsCount: friendUsers.length,
        dogFriendsCount: friendDogs.length 
      });
      return { users: friendUsers, dogs: friendDogs };
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch friends',
        code: 'FETCH_FRIENDS_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch friends', appError, { userId, dogId });
      throw appError;
    }
  },
};

export default friendService;