import userService from "../services/userServices";
import express from "express";
import { sanitizeUser } from "../utils/userSanitizer";
import typeSafeLogger from "../utils/typeSafeLogger";
import { toAppError } from "../utils/errors";
import { buildErrorResponse } from "../utils/response";

const userController = {
    createUser: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const { username, email, password } = req.body;
        const requestId = req.requestId;
        typeSafeLogger.logRequest("Received request to create user", { method: req.method, path: req.path });
        if (!username || !email || !password) {
            typeSafeLogger.warn("Create user validation failed: missing fields", { username, email, requestId });
            return res.status(400).json(buildErrorResponse(req, { error: "Missing required fields", code: "VALIDATION_ERROR" }));
        }
        if (password.length < 8) {
            typeSafeLogger.warn("Create user validation failed: password too short", { username, email, requestId });
            return res.status(400).json(buildErrorResponse(req, { error: "Password must be at least 8 characters long", code: "VALIDATION_ERROR" }));
        }
        if (await userService.getUserByEmail(email)) {
            typeSafeLogger.warn("Create user conflict: email already in use", { email, requestId });
            return res.status(409).json(buildErrorResponse(req, { error: "Email already in use", code: "CONFLICT" }));
        }
        try {
            const newUser = await userService.createUser(username, email, password);
            typeSafeLogger.logUserAction("User created", { userId: newUser.id, email });
            res.status(201).json(sanitizeUser(newUser));
        } catch (error) {
            return next(
                toAppError(error, { message: "Failed to create user", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    getUserByEmail: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const { email } = req.params;
        const requestId = req.requestId;
        typeSafeLogger.logRequest("Received request to fetch user by email", { method: req.method, path: req.path });
        try {
            const user = await userService.getUserByEmail(email);
            if (!user) {
                typeSafeLogger.warn("User not found", { email, requestId });
                return res.status(404).json(buildErrorResponse(req, { error: "User not found", code: "NOT_FOUND" }));
            }
            typeSafeLogger.logUserAction("User retrieved", { userId: user.id, email });
            res.status(200).json(sanitizeUser(user));
        } catch (error) {
            return next(
                toAppError(error, { message: "Failed to retrieve user", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    }
};

export default userController;