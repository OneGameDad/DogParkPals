import userService from "../services/userServices";
import express from "express";
import { sanitizeUser } from "../utils/userSanitizer";
import typeSafeLogger from "../utils/typeSafeLogger";
import { toAppError, ConflictError, NotFoundError, ForbiddenError, isAppError } from "../utils/errors";
import { parseValidation } from "../utils/validator";
import {
    changePasswordSchema,
    createUserSchema,
    deleteUserSchema,
    getUserByEmailSchema,
    getUserByIdSchema,
    getUserByUsernameSchema,
    listUsersSchema,
    resetUserPasswordSchema,
    updateUserProfileSchema,
} from "../utils/validationSchemas";

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
            if (isAppError(error)) {
                return next(error);
            }
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
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to retrieve user", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    getUserById: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to fetch user by id", { method: req.method, path: req.path });
            const id = req.params.id && req.params.id.trim() ? parseValidation(getUserByIdSchema, req.params).id : req.userId;

            if (!id) {
                throw NotFoundError("User not found");
            }

            const user = await userService.getUserById(id);
            if (!user) {
                throw NotFoundError("User not found");
            }
            res.status(200).json(sanitizeUser(user));
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to retrieve user", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    getUserByUsername: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to fetch user by username", { method: req.method, path: req.path });
            const { username } = parseValidation(getUserByUsernameSchema, req.params);

            const user = await userService.getUserByUsername(username);
            if (!user) {
                throw NotFoundError("User not found");
            }
            res.status(200).json(sanitizeUser(user));
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to retrieve user", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    getAllUsers: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to list users", { method: req.method, path: req.path });
            const { page = 1, pageSize = 50 } = parseValidation(listUsersSchema, req.query);

            const users = await userService.listUsers(page, pageSize);
            res.status(200).json(users.map(sanitizeUser));
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to list users", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    deleteUser: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to delete user", { method: req.method, path: req.path });
            const { id } = parseValidation(deleteUserSchema, req.params);

            if (!req.userId || req.userId !== Number(id)) {
                throw ForbiddenError("You can only delete your own account");
            }

            await userService.deleteUser(Number(id));
            res.status(204).send();
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to delete user", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    changePassword: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            if (!req.userId) {
                throw ForbiddenError("Authentication required");
            }

            const { oldPassword, newPassword } = parseValidation(changePasswordSchema, req.body);
            await userService.changePassword(req.userId, oldPassword, newPassword);
            res.status(200).json({ message: "Password changed successfully" });
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to change password", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    updateProfile: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            if (!req.userId) {
                throw ForbiddenError("Authentication required");
            }

            const updates = parseValidation(updateUserProfileSchema, req.body);
            const updatedUser = await userService.updateUserProfile(req.userId, updates);
            typeSafeLogger.logUserAction("User profile updated", { userId: req.userId });
            res.status(200).json(sanitizeUser(updatedUser));
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to update profile", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    resetUserPassword: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to reset user password", { method: req.method, path: req.path });
            
            // Check if user is admin
            const userRole = (req as any).user?.role;
            if (userRole !== 'ADMIN' && userRole !== 'DEVELOPER') {
                throw ForbiddenError("Only admins can reset passwords");
            }

            const { userId, newPassword } = parseValidation(resetUserPasswordSchema, req.body);
            await userService.resetUserPassword(userId, newPassword);
            res.status(200).json({ message: "Password reset successfully" });
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to reset password", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    uploadProfilePicture: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to upload profile picture", {
              method: req.method,
              path: req.path,
            });

            if (!req.userId) throw ForbiddenError("Authentication required");
            if (!req.file) throw toAppError(new Error("No file uploaded"), {
                      message: "No file uploaded",
                      code: "NO_FILE_UPLOADED",
                    statusCode: 400,
                    });
            await userService.uploadProfilePicture(req.userId, req.file.path);
            const profilePictureUrl = `/api/files/users/${req.userId}/profile-picture`;

            res.status(200).json({
              message: "Profile picture uploaded successfully",
              profilePictureUrl,
            });
        } catch (error) {
            if (isAppError(error)) return next(error);

            return next(toAppError(error, {
                message: "Failed to upload profile picture",
                code: "INTERNAL_ERROR",
                statusCode: 500,
              }));
        }
    },

    deleteProfilePicture: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to delete profile picture", {
                method: req.method,
                path: req.path,
            });

            if (!req.userId) throw ForbiddenError("Authentication required");

            await userService.deleteProfilePicture(req.userId);

            res.status(200).json({ message: "Profile picture deleted successfully", });
        } catch (error) {
            if (isAppError(error)) return next(error);

            return next(
                toAppError(error, {
                    message: "Failed to delete profile picture",
                    code: "INTERNAL_ERROR",
                    statusCode: 500,
                }));
        }
    },
};

export default userController;