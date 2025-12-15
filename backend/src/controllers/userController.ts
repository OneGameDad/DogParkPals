import userService from "../services/userServices";
import express from "express";
import { sanitizeUser } from "../utils/userSanitizer";
import typeSafeLogger from "../utils/typeSafeLogger";

const userController = {
    createUser: async (req: express.Request, res: express.Response) => {
        const { username, email, password } = req.body;
        typeSafeLogger.logRequest("Received request to create user", { method: req.method, path: req.path });
        if (!username || !email || !password) {
            typeSafeLogger.warn("Create user validation failed: missing fields", { username, email });
            return res.status(400).json({ error: "Missing required fields" });
        }
        if (password.length < 8) {
            typeSafeLogger.warn("Create user validation failed: password too short", { username, email });
            return res.status(400).json({ error: "Password must be at least 8 characters long" });
        }
        if (await userService.getUserByEmail(email)) {
            typeSafeLogger.warn("Create user conflict: email already in use", { email });
            return res.status(409).json({ error: "Email already in use" });
        }
        try {
            const newUser = await userService.createUser(username, email, password);
            typeSafeLogger.logUserAction("User created", { userId: newUser.id, email });
            res.status(201).json(sanitizeUser(newUser));
        } catch (error) {
            typeSafeLogger.logError("Create user failed", error, { email });
            res.status(500).json({ error: "Failed to create user" });
        }
    },

    getUserByEmail: async (req: express.Request, res: express.Response) => {
        const { email } = req.params;
        typeSafeLogger.logRequest("Received request to fetch user by email", { method: req.method, path: req.path });
        try {
            const user = await userService.getUserByEmail(email);
            if (!user) {
                typeSafeLogger.warn("User not found", { email });
                return res.status(404).json({ error: "User not found" });
            }
            typeSafeLogger.logUserAction("User retrieved", { userId: user.id, email });
            res.status(200).json(sanitizeUser(user));
        } catch (error) {
            typeSafeLogger.logError("Failed to retrieve user", error, { email });
            res.status(500).json({ error: "Failed to retrieve user" });
        }
    }
};

export default userController;