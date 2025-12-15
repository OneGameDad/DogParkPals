import userService from "../services/userServices";
import express from "express";
import { sanitizeUser } from "../utils/userSanitizer";
import typeSafeLogger from "../utils/typeSafeLogger";
import { toAppError, ConflictError, NotFoundError } from "../utils/errors";
import { parseValidation } from "../utils/validator";
import { createUserSchema, getUserByEmailSchema } from "../utils/validationSchemas";

const userController = {
    createUser: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to create user", { method: req.method, path: req.path });
            const { username, email, password } = parseValidation(createUserSchema, req.body);

            const existingUser = await userService.getUserByEmail(email);
            if (existingUser) {
                throw ConflictError("Email already in use");
            }

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
        try {
            typeSafeLogger.logRequest("Received request to fetch user by email", { method: req.method, path: req.path });
            const { email } = parseValidation(getUserByEmailSchema, req.params);

            const user = await userService.getUserByEmail(email);
            if (!user) {
                throw NotFoundError("User not found");
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