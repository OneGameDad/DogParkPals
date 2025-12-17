import friendService from "../services/friendService";
import express from "express";
import typeSafeLogger from "../utils/typeSafeLogger";
import { toAppError, NotFoundError } from "../utils/errors";
import { parseValidation } from "../utils/validator";
import { createFriendRequestSchema, getUserIdSchema, removeFriendSchema } from "../utils/validationSchemas";

const friendController = {
    addFriend: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        //TODO check if friendship already exists
        try {
            typeSafeLogger.logRequest("Received request to add friend, checking if it already exists", { method: req.method, path: req.path });
            const { requesterId, addresseeId } = parseValidation(createFriendRequestSchema, req.body);

            const existingFriends = await friendService.getFriend(requesterId);
            const alreadyFriends = existingFriends.some(friend => friend.id === addresseeId);
        }
        catch (error) {
            return next(
                toAppError(error, { message: "Failed to check existing friends", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
        try {
            typeSafeLogger.logRequest("Received request to add friend", { method: req.method, path: req.path });
            const { requesterId, addresseeId } = parseValidation(createFriendRequestSchema, req.body);

            const newFriendship = await friendService.sendFriendRequest(requesterId, addresseeId);
            typeSafeLogger.logUserAction("Friend added", { requesterId, addresseeId });
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
            const { requesterId, addresseeId } = parseValidation(createFriendRequestSchema, req.body);

            const updatedFriendship = await friendService.acceptFriendRequest(requesterId, addresseeId);
            typeSafeLogger.logUserAction("Friend request accepted", { requesterId, addresseeId });
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
            const { requesterId, addresseeId } = parseValidation(createFriendRequestSchema, req.body);

            const updatedFriendship = await friendService.declineFriendRequest(requesterId, addresseeId);
            typeSafeLogger.logUserAction("Friend request declined", { requesterId, addresseeId });
            res.status(200).json(updatedFriendship);
        } catch (error) {
            return next(
                toAppError(error, { message: "Failed to decline friend request", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    removeFriend: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to remove friend, checking if friendship exists", { method: req.method, path: req.path });
            const { userId, friendId } = parseValidation(removeFriendSchema, req.body);

            const existingFriends = await friendService.getFriend(userId);
            const friendshipExists = existingFriends.some(friend => friend.id === friendId);
            if (!friendshipExists) {
                throw NotFoundError("Friendship does not exist");
            }
        }
        catch (error) {
            return next(
                toAppError(error, { message: "Failed to check existing friendship", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
        try {
            typeSafeLogger.logRequest("Received request to remove friend", { method: req.method, path: req.path });
            const { userId, friendId } = parseValidation(removeFriendSchema, req.body);

            await friendService.removeFriend(userId, friendId);
            typeSafeLogger.logUserAction("Friend removed", { userId, friendId });
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
            const { userId } = parseValidation(getUserIdSchema, req.params);

            const friendsList = await friendService.getFriendsList(userId);
            typeSafeLogger.logUserAction("Friends list retrieved", { userId, friendsCount: friendsList.length });
            res.status(200).json(friendsList);
        } catch (error) {
            return next(
                toAppError(error, { message: "Failed to get friends list", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    getFriend: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to get friend, checking if friendship exists", { method: req.method, path: req.path });
            const { userId, friendId } = parseValidation(removeFriendSchema, req.body);

            const existingFriends = await friendService.getFriend(userId);
            const friendshipExists = existingFriends.some(friend => friend.id === friendId);
            if (!friendshipExists) {
                throw NotFoundError("Friendship does not exist");
            }
        } catch (error) {
            return next(
                toAppError(error, { message: "Failed to check existing friendship", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
        try {
            typeSafeLogger.logRequest("Received request to get a friend", { method: req.method, path: req.path });
            const { userId } = parseValidation(getUserIdSchema, req.params);

            const friends = await friendService.getFriend(userId);
            typeSafeLogger.logUserAction("Friend retrieved", { userId, friendsCount: friends.length });
            res.status(200).json(friends);
        } catch (error) {
            return next(
                toAppError(error, { message: "Failed to get friend", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },
};

export default friendController;