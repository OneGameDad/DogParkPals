import friendService from "../services/friendService";
import enemyService from "../services/enemyService";
import express from "express";
import typeSafeLogger from "../utils/typeSafeLogger";
import { toAppError, NotFoundError, isAppError } from "../utils/errors";
import { parseValidation } from "../utils/validator";
import { createFriendRequestSchema, getUserIdSchema, removeFriendSchema, friendshipIdSchema, getFriendsSchema } from "../utils/validationSchemas";
import { awardExperience, XP_REWARDS } from "../services/xpService";

const friendController = {
    addFriend: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to add friend", { method: req.method, path: req.path });
            const { requesterId, addresseeId, requesterDogId, addresseeDogId, confirmRemoveEnemy } = parseValidation(createFriendRequestSchema, req.body);

            // Check if addressee is on requester's enemy list (only for user-to-user relationships)
            if (requesterId && addresseeId) {
                const isEnemyRelation = await enemyService.isEnemy(requesterId, addresseeId);
                
                if (isEnemyRelation && !confirmRemoveEnemy) {
                    // Enemy found and no confirmation provided - ask for confirmation
                    typeSafeLogger.logUserAction("Friend request blocked - addressee is enemy, confirmation required", { requesterId, addresseeId });
                    return res.status(409).json({
                        requiresConfirmation: true,
                        message: 'This user is currently on your enemy list. Adding as friend will remove them from enemies.',
                        existingRelationship: 'enemy',
                        code: 'ENEMY_CONFIRMATION_REQUIRED'
                    });
                }
                
                if (isEnemyRelation && confirmRemoveEnemy) {
                    // Enemy found and confirmation provided - remove from enemy list first
                    typeSafeLogger.logUserAction("Removing user from enemy list before adding as friend", { requesterId, addresseeId });
                    await enemyService.removeEnemy(requesterId, addresseeId);
                }
            }

            const newFriendship = await friendService.sendFriendRequest(requesterId, addresseeId, requesterDogId, addresseeDogId);
            typeSafeLogger.logUserAction("Friend added", { requesterId, addresseeId, requesterDogId, addresseeDogId });
            if (newFriendship.status === 'ACCEPTED') {
                const awards = [] as Promise<any>[];
                if (newFriendship.requesterId) {
                    awards.push(awardExperience(newFriendship.requesterId, XP_REWARDS.ADD_FRIEND, 'friend_added'));
                }
                if (newFriendship.addresseeId) {
                    awards.push(awardExperience(newFriendship.addresseeId, XP_REWARDS.ADD_FRIEND, 'friend_added'));
                }
                await Promise.all(awards);
            }
            res.status(201).json(newFriendship);
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to add friend", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    acceptFriendRequest: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to accept friend request", { method: req.method, path: req.path });
            const { friendshipId } = parseValidation(friendshipIdSchema, req.body);

            const updatedFriendship = await friendService.acceptFriendRequest(friendshipId);
            typeSafeLogger.logUserAction("Friend request accepted", { friendshipId });
            const awards = [] as Promise<any>[];
            if (updatedFriendship.requesterId) {
                awards.push(awardExperience(updatedFriendship.requesterId, XP_REWARDS.ADD_FRIEND, 'friend_accepted'));
            }
            if (updatedFriendship.addresseeId) {
                awards.push(awardExperience(updatedFriendship.addresseeId, XP_REWARDS.ADD_FRIEND, 'friend_accepted'));
            }
            await Promise.all(awards);
            res.status(200).json(updatedFriendship);
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to accept friend request", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    declineFriendRequest: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to decline friend request", { method: req.method, path: req.path });
            const { friendshipId } = parseValidation(friendshipIdSchema, req.body);

            const updatedFriendship = await friendService.declineFriendRequest(friendshipId);
            typeSafeLogger.logUserAction("Friend request declined", { friendshipId });
            res.status(200).json(updatedFriendship);
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to decline friend request", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    removeFriend: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to remove friend", { method: req.method, path: req.path });
            const { userId, friendId, dogId, friendDogId } = parseValidation(removeFriendSchema, req.body);

            await friendService.removeFriend(userId, friendId, dogId, friendDogId);
            typeSafeLogger.logUserAction("Friend removed", { userId, friendId, dogId, friendDogId });
            res.status(200).json({ message: "Friend removed successfully" });
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to remove friend", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    getFriendsList: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to get friends list", { method: req.method, path: req.path });
            const userId = req.query.userId ? Number(req.query.userId) : undefined;
            const dogId = req.query.dogId ? Number(req.query.dogId) : undefined;
            const validatedParams = parseValidation(getFriendsSchema, { userId, dogId });

            const friendsList = await friendService.getFriendsList(validatedParams.userId, validatedParams.dogId);
            const totalCount = friendsList.users.length + friendsList.dogs.length;
            typeSafeLogger.logUserAction("Friends list retrieved", { userId: validatedParams.userId, dogId: validatedParams.dogId, userFriendsCount: friendsList.users.length, dogFriendsCount: friendsList.dogs.length });
            res.status(200).json(friendsList);
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to get friends list", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    getFriend: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to get a friend", { method: req.method, path: req.path });
            const userId = req.query.userId ? Number(req.query.userId) : undefined;
            const dogId = req.query.dogId ? Number(req.query.dogId) : undefined;
            const validatedParams = parseValidation(getFriendsSchema, { userId, dogId });

            const friends = await friendService.getFriend(validatedParams.userId, validatedParams.dogId);
            const totalCount = friends.users.length + friends.dogs.length;
            typeSafeLogger.logUserAction("Friend retrieved", { userId: validatedParams.userId, dogId: validatedParams.dogId, userFriendsCount: friends.users.length, dogFriendsCount: friends.dogs.length });
            res.status(200).json(friends);
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to get friend", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },
};

export default friendController;