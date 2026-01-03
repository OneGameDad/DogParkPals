import friendService from "../services/friendService";
import express from "express";
import typeSafeLogger from "../utils/typeSafeLogger";
import { toAppError, NotFoundError } from "../utils/errors";
import { parseValidation } from "../utils/validator";
import { createFriendRequestSchema, getUserIdSchema, removeFriendSchema, friendshipIdSchema, getFriendsSchema } from "../utils/validationSchemas";

const friendController = {
    addFriend: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to add friend", { method: req.method, path: req.path });
            const { requesterId, addresseeId, requesterDogId, addresseeDogId } = parseValidation(createFriendRequestSchema, req.body);

            const newFriendship = await friendService.sendFriendRequest(requesterId, addresseeId, requesterDogId, addresseeDogId);
            typeSafeLogger.logUserAction("Friend added", { requesterId, addresseeId, requesterDogId, addresseeDogId });
            res.status(201).json(newFriendship);
        } catch (error) {
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
            res.status(200).json(updatedFriendship);
        } catch (error) {
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
            return next(
                toAppError(error, { message: "Failed to get friend", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },
};

export default friendController;